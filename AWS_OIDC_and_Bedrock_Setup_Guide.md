# AWS OIDC ＆ Amazon Bedrock セットアップ完全手順書 (Keyless アーキテクチャ)

本ドキュメントは、GitHub Actions から静的な AWS API キー（`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`）を一切使用せず、**OpenID Connect (OIDC)** を用いて一時的アクセス権（IAM Role）に昇格し、**Amazon Bedrock / Bedrock Guardrails** を安全に呼び出すための AWS 側および GitHub 側のセットアップ手順書です。

---

## 1. アーキテクチャ概要

```
[GitHub Actions (CI/CD)]
   │ 1. GitHub 発行のデジタル証明書(JWT)を提示 (id-token: write)
   ▼
[AWS IAM Identity Provider (token.actions.githubusercontent.com)]
   │ 2. リポジトリ名 (penguinmura/aisvs-secure-ai-lab) とブランチ条件を検証
   ▼
[AWS IAM Role (GitHubActionsBedrockRole)]
   │ 3. 1時間限定の一時アクセス権 (STS:AssumeRoleWithWebIdentity) を授与
   ▼
[Amazon Bedrock / Bedrock Guardrails]
   │ 4. Promptfoo 敵対的テスト ＆ PR Diff インジェクションスキャンを実行
```

---

## 2. ステップ 1: AWS OIDC アイデンティティプロバイダの作成

AWS 管理コンソールにて、GitHub Actions からの認証要求を受け入れる OIDC プロバイダを作成します。

1. **AWS Console ➔ IAM ➔ アイデンティティプロバイダ ➔ プロバイダを追加**
2. **プロバイダのタイプ**: `OpenID Connect`
3. **プロバイダの URL**: `https://token.actions.githubusercontent.com`
4. **対象者 (Audience)**: `sts.amazonaws.com`
5. **「プロバイダを追加」** をクリック。

---

## 3. ステップ 2: IAM ロールの作成と信頼関係 (Trust Policy) の設定

特定のリポジトリからのみアクセスを許可する信頼関係ポリシーを持つ IAM ロールを作成します。

### 3.1 信頼関係ポリシー JSON (`trust-policy.json`)
※ `<AWS_ACCOUNT_ID>` および `<GITHUB_ORG_OR_USER>` と `<REPO_NAME>` をご自身環境に書き換えてください。

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
          "token.actions.githubusercontent.com:sub": "repo:<GITHUB_ORG_OR_USER>/<REPO_NAME>:*"
        }
      }
    }
  ]
}
```

### 3.2 IAM ロールの作成
1. **IAM ➔ ロール ➔ ロールを作成**
2. **信頼されたエンティティタイプ**: `カスタム信頼ポリシー`
3. 上記の JSON を貼り付けてロールを作成（ロール名: `GitHubActionsBedrockRole`）。
4. **作成された Role ARN を控える** (例: `arn:aws:iam::123456789012:role/GitHubActionsBedrockRole`)

---

## 4. ステップ 3: IAM 許可ポリシー (Bedrock 権限) のアタッチ

作成した IAM ロールに、Amazon Bedrock を呼び出す最小権限ポリシーをアタッチします。

### 4.1 Bedrock 許可ポリシー JSON (`bedrock-policy.json`)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockModelInvocation",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ApplyGuardrail"
      ],
      "Resource": "*"
    }
  ]
}
```

1. **IAM ➔ ポリシー ➔ ポリシーを作成** (名称: `GitHubActionsBedrockPolicy`)
2. 上記の JSON を貼り付けて作成し、`GitHubActionsBedrockRole` にアタッチします。

---

## 5. ステップ 4: Amazon Bedrock ガードレールの作成と Guardrail ID 取得

PR 内容やプロンプトのインジェクション攻撃をリアルタイム自動検知するための Bedrock Guardrails を作成します。

1. **AWS Console ➔ Amazon Bedrock ➔ Guardrails ➔ Create guardrail**
2. **Name**: `AISVS-PR-Security-Guardrail`
3. **Prompt Attack Filter (プロンプト攻撃フィルター)**:
   * **Prompt Attack**: `Enabled` (Strength: `High`)
4. **Content Filters (コンテンツフィルター)**:
   * Sexual, Hate, Violence, Harmful: `Block` (High)
5. **Sensitive Information Filters (PII・個人情報フィルター)**:
   * Regex フィルターや標準 PII フィルターを有効化
6. **作成完了後、Guardrail ID を控える** (例: `a1b2c3d4e5f6`)
7. **Publish version** を押して Version `1` を作成・発行。

---

## 6. ステップ 5: GitHub リポジトリヘの Secrets / Variables 登録

作成した AWS リソース情報を GitHub リポジトリに安全に登録します。

> リポジトリの **Settings** ➔ **Secrets and variables** ➔ **Actions**

### 🔑 `Repository secrets`（秘密情報）に登録するもの
* **`BEDROCK_GUARDRAIL_ID`**: ステップ 4 で取得した Guardrail ID (例: `a1b2c3d4e5f6`)

### 🌐 `Repository variables` (環境変数) または Secrets に登録するもの
* **`AWS_ROLE_ARN`**: ステップ 3 で取得した IAM Role ARN (例: `arn:aws:iam::123456789012:role/GitHubActionsBedrockRole`)
* **`AWS_REGION`**: `us-east-1` (または利用する AWS リージョン)

---

## 7. ステップ 6: 動作確認とテスト

1. GitHub リポジトリの **Actions** タブを開く。
2. **`Nightly Promptfoo Adversarial Test`** を選択し、**Run workflow** (手動実行) をクリック。
3. ログを確認し、静的 API キーなしで AWS OIDC 認証が成功し、Bedrock 上の Claude 3.5 Sonnet 等に対する Promptfoo スキャンが正常動作することを確認します。
