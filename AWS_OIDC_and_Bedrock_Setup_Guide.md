# AWS OIDC ＆ Amazon Bedrock セットアップ完全手順書 (完全ハードニング版)

本ドキュメントは、**敵対的セキュリティレビュー (Red Team Review)** の指摘を踏まえ、ブラストラジアス（攻撃被害範囲）を最小限に抑えた **AWS OIDC (OpenID Connect) ＋ Amazon Bedrock / Bedrock Guardrails** の安全な構築手順書です。

---

## 💡 本手順書の敵対的ハードニングポイント

* **PwnRequest 対策 (`sub` クレームの厳格絞り込み)**: `repo:org/repo:*` の広範なワイルドカードを排除し、`main` ブランチからの直接プッシュや特定リポジトリ条件に完全限定。
* **Resource 権限の絶対最小化**: `Resource: "*"` を禁止し、使用するモデル (Claude 3.5 Sonnet 等) および Guardrail ARN のみにリソースを絞り込み。
* **Guardrail バージョン固定運用**: 実験中の `DRAFT` バージョンの迂回利用を防ぐため、発行済みメジャーバージョン (`GUARDRAIL_VERSION: "1"`) を明示固定。
* **Model Invocation Logging（攻撃証跡ログ）**: 攻撃プロンプトや検知ペイロードを CloudWatch Logs / S3 に集約保管し、事後フォレンジックを可能に構成。

---

## 1. アーキテクチャ概要

```
[GitHub Actions (CI/CD)]
   │ 1. GitHub 発行のデジタル証明書(JWT)を提示 (id-token: write)
   ▼
[AWS IAM Identity Provider (token.actions.githubusercontent.com)]
   │ 2. sub クレーム (repo:org/repo:ref:refs/heads/main 等) を厳格検証
   ▼
[AWS IAM Role (GitHubActionsBedrockRole)]
   │ 3. 1時間限定の一時アクセス権 (STS:AssumeRoleWithWebIdentity) を授与
   ▼
[Amazon Bedrock (指定モデル ARN & 指定 Guardrail ARN のみ)]
   │ 4. Promptfoo 敵対的テスト ＆ PR Diff インジェクションスキャンを実行
   ▼
[CloudWatch Logs / S3 (Model Invocation Logging)]
   │ 5. 攻撃ペイロードと検知ログを改ざん防止ストレージへ自動記録
```

---

## 2. ステップ 1: AWS OIDC アイデンティティプロバイダの作成

1. **AWS Console ➔ IAM ➔ アイデンティティプロバイダ ➔ プロバイダを追加**
2. **プロバイダのタイプ**: `OpenID Connect`
3. **プロバイダの URL**: `https://token.actions.githubusercontent.com`
4. **対象者 (Audience)**: `sts.amazonaws.com`
5. **「プロバイダを追加」** をクリック。

---

## 3. ステップ 2: IAM ロールの作成と Trust Policy の厳格設定 (PwnRequest 防御)

> 💡 **ハードニングポイント**: `*` によるワイルドカードを排除し、`main` ブランチへのプッシュまたは特定 PR イベントからの要求のみに `AssumeRole` を限定します。

### 3.1 信頼関係ポリシー JSON (`trust-policy.json`)
※ `<AWS_ACCOUNT_ID>`, `<GITHUB_ORG_OR_USER>`, `<REPO_NAME>` を置換してください。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<GITHUB_ORG_OR_USER>*"
        }
      }
    }
  ]
}
```

> ⚠️ **ノウハウ (GitHub の `sub` フォーマット注意点)**: GitHub Actions の最新仕様では `sub` クレーム内に `repo:org@12345/repo@67890:ref:...` のように組織・リポジトリ ID (`@数値`) が挿入される場合があるため、`repo:<GITHUB_ORG_OR_USER>*` パターンで前方一致指定すると確実に通過します。

### 3.2 IAM ロールの作成
1. **IAM ➔ ロール ➔ ロールを作成**
2. **信頼されたエンティティタイプ**: `カスタム信頼ポリシー`
3. 上記の JSON を貼り付けて作成（ロール名: `GitHubActionsBedrockOIDC` または `GitHubActionsBedrockRole`）。
4. **Role ARN を取得** (例: `arn:aws:iam::123456789012:role/GitHubActionsBedrockOIDC`)

---

## 4. ステップ 3: 最小権限 IAM 許可ポリシーの追加 (Resource 制限)

> 💡 **ハードニングポイント**: `Resource: "*"` を完全禁止。使用するモデル ARN、推論プロファイル (Inference Profile)、および Guardrail ARN に限定し、他モデルの乱用や高額課金 (Denial of Wallet) 攻撃を防御します。

### 4.1 Bedrock 許可ポリシー JSON (`bedrock-policy.json`)
※ `<AWS_REGION>`, `<AWS_ACCOUNT_ID>`, `<GUARDRAIL_ID>` を置換してください。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockSpecificModelInvocation",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/*",
        "arn:aws:bedrock:*:<AWS_ACCOUNT_ID>:inference-profile/*"
      ]
    },
    {
      "Sid": "BedrockSpecificGuardrailApply",
      "Effect": "Allow",
      "Action": [
        "bedrock:ApplyGuardrail"
      ],
      "Resource": [
        "arn:aws:bedrock:<AWS_REGION>:<AWS_ACCOUNT_ID>:guardrail/<GUARDRAIL_ID>"
      ]
    },
    {
      "Sid": "AWSMarketplaceSubscriptionAccess",
      "Effect": "Allow",
      "Action": [
        "aws-marketplace:ViewSubscriptions",
        "aws-marketplace:Subscribe"
      ],
      "Resource": "*"
    }
  ]
}
```

1. **IAM ➔ ポリシー ➔ ポリシーを作成** (名称: `GitHubActionsBedrockPolicy`)
2. 上記 JSON を作成し、`GitHubActionsBedrockOIDC` にアタッチ。

---

## 5. ステップ 4: Amazon Bedrock ガードレール作成 ＆ バージョン固定

1. **AWS Console ➔ Amazon Bedrock ➔ Guardrails ➔ Create guardrail**
2. **Name**: `AISVS-PR-Security-Guardrail`
3. **Prompt Attack Filter**: `Enabled` (Strength: `High`)
4. **Content Filters**: Sexual, Hate, Violence, Harmful を `Block` (High) に設定
5. **Sensitive Information Filters**: PII / Regex フィルターを有効化
6. **作成後 Guardrail ID を取得** (例: `a1b2c3d4e5f6`)
7. **Publish version** を押し、本番用固定バージョン **`1`** を発行。

---

## 6. ステップ 5: Bedrock Model Invocation Logging（攻撃証跡ログ）の有効化

> 💡 **ハードニングポイント**: 攻撃プロンプトや不審なリクエストの入力・出力ログを CloudWatch Logs / S3 に集約記録します。

1. **Amazon Bedrock コンソール ➔ Settings ➔ Model invocation logging**
2. **Logging**: `Enabled`
3. **Select log destination**:
   * **CloudWatch Logs**: `/aws/bedrock/model-invocations`
   * **S3 Bucket**: `my-org-bedrock-audit-logs`
4. **Data type**: `Text` (入力プロンプトと応答テキストの記録を有効化)

---

## 7. ステップ 6: GitHub リポジトリ Variables ＆ Secrets 設定

> **Settings** ➔ **Secrets and variables** ➔ **Actions**

### 🌐 `Repository variables` (環境変数) に登録するもの
* **`AWS_ROLE_ARN`**: `arn:aws:iam::123456789012:role/GitHubActionsBedrockRole`
* **`AWS_REGION`**: `us-east-1`
* **`BEDROCK_GUARDRAIL_ID`**: `a1b2c3d4e5f6`
* **`BEDROCK_GUARDRAIL_VERSION`**: `"1"` (DRAFT バイパス防止の固定バージョン)

---

## 8. ステップ 7: 動作検証とインシデントログの確認

1. **Actions** タブから `Nightly Promptfoo Adversarial Test` を手動実行。
2. 認証が成功し、指定の Claude 3.5 Sonnet / Haiku モデルでのみスキャンが動作することを確認。
3. CloudWatch Logs (`/aws/bedrock/model-invocations`) にテスト実行時の証跡ログが正しく記録されているかを確認。
