# GitHub ✕ OWASP AISVS 安全導入・構築セットアップガイド

本ガイドは、**OWASP AISVS (AI Code Assurance) Appendix C (Level 1〜Level 2)** のセキュリティ基準をクリアするために、**GitHub 環境（GitHub Enterprise / Copilot / Actions / Rulesets）で実施すべき設定および実装手順**をステップバイステップでまとめた実践手順書です。

---

## 1. 全体ロードマップ & 前提条件

### 必要な権限・前提環境
* **GitHub 組織管理者権限 (Org Admin)**: Audit Log Streaming、Enterprise ポリシー設定に必要
* **リポジトリ管理者権限 (Repo Admin)**: Rulesets、CODEOWNERS、Actions Secrets、Content Exclusion 設定に必要
* **AWS アカウントアクセス権限**: Bedrock Guardrails / S3 / Athena 連携時に使用

### 全体構築ロードマップ
```
[ステップ1: リポジトリ構成ファイルの配置] (.copilotignore / CODEOWNERS / ガイドライン / Issueテンプレート)
       ↓
[ステップ2: GitHub Rulesets の設定] (ブランチ保護 / ステータスチェック必須化 / 自己承認禁止)
       ↓
[ステップ3: GitHub Actions ワークフローの実装] (セキュリティ統合スキャン / SLSAプロベナンス署名 / ナイトリーテスト)
       ↓
[ステップ4: GitHub Audit Log Streaming 設定] (S3 Object Lock 連携)
       ↓
[ステップ5: 開発環境 (Codespaces) ＆ Git設定] (コミットトレーラー自動化 / シークレット分離)
```

---

## 2. ステップ1: リポジトリ構成ファイルの配置

リポジトリのルートまたは指定ディレクトリに、AIガバナンスに必要な設定ファイルを配置します。

### 1.1 `.copilotignore` の配置（コンテキスト機密除外: AC.3.1 - AC.3.2）
リポジトリのルートに `.copilotignore` を作成し、AI が参照してはならない機密ファイルやテストデータを遮断します。

**ファイルパス: `.copilotignore`**
```gitignore
# シークレット・資格情報
secrets/
*.pem
*.key
.env*

# テスト用フィクスチャデータ（ダミーキーや機密モックデータ含む）
test/fixtures/
tests/fixtures/
spec/fixtures/

# CI/CDの高度な秘密情報サンプル
.github/secrets/
```

### 1.2 `CODEOWNERS` の配置（重要パスの昇格レビュー: AC.4.4 / AC.7.4 / AC.11.2 / AC.12.5）
重要ファイル変更時にセキュリティチームの承認を強制するため、`CODEOWNERS` を配置します。

**ファイルパス: `.github/CODEOWNERS`**
```gitignore
# 認証・認可に関する核心ロジック
/src/auth/                      @my-org/sec-team
/src/security/                  @my-org/sec-team

# CI/CD ワークフロー定義およびボット設定（サプライチェーン攻撃防御）
/.github/workflows/             @my-org/sec-team
/.github/CODEOWNERS             @my-org/sec-team
/.copilotignore                 @my-org/sec-team

# インフラストラクチャ定義 (IaC)
/terraform/                     @my-org/sec-team @my-org/devops-team
Dockerfile                      @my-org/sec-team @my-org/devops-team
docker-compose*.yml             @my-org/sec-team @my-org/devops-team
```

### 1.3 `SECURITY_AI_GUIDELINES.md` の配置（利用規約 & 脅威定義: AC.1.1 - AC.1.3）
開発者が遵守すべき AI 利用ルールと想定脅威を明記します。

**ファイルパス: `SECURITY_AI_GUIDELINES.md`**
```markdown
# AI 支援開発利用セキュリティガイドライン (AISVS 準拠)

## 1. 目的
本ガイドラインは、GitHub Copilot および AI CLI ツールを安全に利用し、OWASP AISVS Appendix C に基づくセキュリティレベルを維持することを目的とします。

## 2. 利用ルール
- **シークレットの入力禁止**: APIキー、アクセス文脈、認証情報をプロンプトに送信してはなりません。
- **Human-in-the-Loop の徹底**: AIが提案したコードおよびCLIコマンドは、必ず人間が内容を目視確認・検証してから実行・マージしてください（Auto-Approve 禁止）。
- **自己承認の禁止**: AIボットが作成または承認した Pull Request を直接マージしてはなりません。

## 3. 想定される敵対的AI脅威シナリオ
- **プロンプトインジェクション**: PR本文や外部コードコメントに含まれる悪意ある指示による情報の流出や誤動作。
- **Slopsquatting (AIハルシネーション攻撃)**: AIが存在しない偽のパッケージを提案し、悪意ある同名パッケージが実行される脅威。
- **資格情報流出**: CDE環境変数からAI CLI経由で資格情報が外部に持ち出される脅威。
```

### 1.4 AI 通報用 Issue テンプレートの配置（フィードバック追跡: AC.6.1）
AI の危険な提案を通報・起票できるテンプレートを設置します。

**ファイルパス: `.github/ISSUE_TEMPLATE/ai-security-report.yml`**
```yaml
name: "AI不適切・危険提案レポート"
description: "GitHub Copilot 等のAIツールによる危険なコード提案や誤動作を報告します"
title: "[AI Security] "
labels: ["ai-security", "triage"]
body:
  - type: textarea
    id: prompt_context
    attributes:
      label: "入力したプロンプト / コンテキスト"
      description: "どのような指示やコンテキストを入力したか記述してください"
    validations:
      required: true
  - type: textarea
    id: ai_output
    attributes:
      label: "AIの不適切提案・出力内容"
      description: "不適切・危険と判断したコードや出力を貼り付けてください"
    validations:
      required: true
  - type: dropdown
    id: risk_category
    attributes:
      label: "リスクカテゴリ"
      options:
        - "ハードコードシークレット提案"
        - "脆弱なコード（SQLi, XSS等）の生成"
        - "存在しない依存パッケージの提案（Slopsquatting）"
        - "その他プロンプトインジェクション等"
```

---

## 3. ステップ2: GitHub Rulesets（ブランチ保護ルール）の設定手順

GitHub の Web UI (または API) から `main` ブランチに対する保護ルール（Rulesets）を設定します。

### 設定画面へのアクセス
> リポジトリの **Settings** ➔ **Code and automation** ➔ **Rulesets** ➔ **New ruleset** ➔ **New branch ruleset**

### 必須設定項目一覧

1. **General**:
   - **Ruleset Name**: `AISVS Production Protection`
   - **Enforcement status**: `Active`
   - **Target branches**: `Include default branch` (`main`)

2. **Bypass list**:
   - ⚠️ **重要 (AC.8.1-8.3)**: `Bypass list` に AI ボットのアカウントや `github-actions[bot]` を**絶対に追加しない**でください（ボットによるルール迂回を防止）。

3. **Rules 設定**:
   - **Restrict deletions**: 有効化
   - **Require a pull request before merging**:
     - **Required approvals**: `1` 以上
     - **Dismiss stale pull request approvals when new commits are pushed**: 有効化
     - **Require review from Code Owners**: 有効化（AC.4.4 / AC.7.4 / AC.12.5）
     - **Require approval of the most recent reviewable push**: 有効化
     - **Require conversation resolution before merging**: 有効化
   - **Require status checks to pass**:（AC.4.2 / AC.12.8）
     - **Require branches to be up to date before merging**: 有効化
     - **Status checks に指定するジョブ名**:
       - `security-scan / gitleaks`
       - `security-scan / codeql`
       - `security-scan / dependency-review`
       - `security-scan / checkov`
       - `security-scan / bedrock-guardrails`

---

## 4. ステップ3: GitHub Actions CI/CD ワークフローの構築

PR 作成時および定期ビルド時に実行する GitHub Actions ワークフローを作成します。

### 3.1 統合セキュリティスキャン `.github/workflows/security-scan.yml`
（Gitleaks ＋ CodeQL ＋ Dependency Review ＋ Checkov ＋ Bedrock Guardrails）

**ファイルパス: `.github/workflows/security-scan.yml`**
```yaml
name: "AISVS Security Scan"

on:
  pull_request:
    branches: [ "main" ]

# 権限最小化 (AC.11.4 / AC.12.1)
permissions:
  contents: read
  pull-requests: read
  security-events: write

jobs:
  # 1. ハードコードシークレット検知 (AC.3.1)
  gitleaks:
    name: "gitleaks"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false # トークン残留防止 (AC.12.2)

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # 2. SAST 静的コード解析 (AC.4.2)
  codeql:
    name: "codeql"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: 'javascript-typescript,python'

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

  # 3. 偽パッケージ/ハルシネーション検知 (AC.13.3)
  dependency-review:
    name: "dependency-review"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high

  # 4. IaC / 設定ファイル危険検証 (AC.7.2 - AC.7.3)
  checkov:
    name: "checkov"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Run Checkov
        uses: bridgecrewio/checkov-action@master
        with:
          framework: all
          output_format: cli
          soft_fail: false

  # 5. Amazon Bedrock Guardrails によるプロンプトインジェクション検知 (AC.3.3 / AC.11.1)
  bedrock-guardrails:
    name: "bedrock-guardrails"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install AWS SDK
        run: pip install boto3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Run Bedrock Guardrail Scan
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_BODY: ${{ github.event.pull_request.body }}
          GUARDRAIL_ID: ${{ secrets.BEDROCK_GUARDRAIL_ID }}
          GUARDRAIL_VERSION: "1"
        run: |
          python - << 'EOF'
          import os, sys, boto3

          pr_title = os.environ.get('PR_TITLE', '')
          pr_body = os.environ.get('PR_BODY', '')
          guardrail_id = os.environ.get('GUARDRAIL_ID')
          guardrail_version = os.environ.get('GUARDRAIL_VERSION', '1')

          text_to_check = f"{pr_title}\n{pr_body}"
          if not text_to_check.strip() or not guardrail_id:
              print("No input or Guardrail ID missing. Skipping.")
              sys.exit(0)

          client = boto3.client('bedrock-runtime', region_name='us-east-1')
          response = client.apply_guardrail(
              guardrailIdentifier=guardrail_id,
              guardrailVersion=guardrail_version,
              source='INPUT',
              content=[{'text': {'text': text_to_check}}]
          )

          if response.get('action') == 'BLOCKED':
              print("❌ Security Alert: Prompt Injection or Violation Detected in PR Content!")
              sys.exit(1)

          print("✅ PR Content passed Bedrock Guardrails inspection.")
          EOF
```

---

### 3.2 SLSA プロベナンス暗号署名ビルド `.github/workflows/build-attestation.yml` (AC.9.1)

**ファイルパス: `.github/workflows/build-attestation.yml`**
```yaml
name: "Build and Attest Artifact"

on:
  push:
    branches: [ "main" ]

permissions:
  id-token: write
  contents: read
  attestations: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Build Artifact
        run: |
          mkdir -p dist
          echo "Release Build v1.0.0" > dist/app.bin

      - name: Generate Artifact Attestation (SLSA Provenance)
        uses: actions/attest-build-provenance@v1
        with:
          subject-path: 'dist/app.bin'
```

---

### 3.3 ナイトリー動的敵対的テスト `.github/workflows/nightly-promptfoo.yml` (AC.2.3 / AC.6.3)

> 💡 **こだわりのポイント**: 外部に平文の API キー (`OPENAI_API_KEY`) を保持・手渡しせず、**AWS OIDC (IAM Role 昇格)** 経由で Amazon Bedrock 上の同等類似モデル (Claude 3.5 Sonnet 等) を呼び出して、キーレスで安全に自社プロンプト指示の受動・能動的テストを毎夜実行します。

**ファイルパス: `.github/workflows/nightly-promptfoo.yml`**
```yaml
name: "Nightly Promptfoo Adversarial Test"

on:
  schedule:
    - cron: '0 2 * * *' # 毎日午前2時実行
  workflow_dispatch:

permissions:
  id-token: write # AWS OIDC 昇格用権限
  contents: read

jobs:
  promptfoo-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Configure AWS Credentials via OIDC (Keyless)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsBedrockRole
          aws-region: us-east-1

      - name: Run promptfoo Red Team Scan via AWS Bedrock (No Static API Keys)
        run: |
          npx promptfoo@latest redteam run --config promptfooconfig.yaml --no-progress-bar
        env:
          AWS_REGION: "us-east-1"
```

---

## 5. ステップ4: GitHub Audit Log Streaming 設定手順

GitHub の操作ログを改ざん防止ストレージ (AWS S3 Object Lock) にリアルタイム送信する手順です。

### 5.1 GitHub 管理画面での設定
> **Organization Settings** ➔ **Settings** ➔ **Audit log** ➔ **Streaming** ➔ **Add stream** ➔ **Amazon S3**

1. **Bucket name**: `my-org-github-audit-logs`
2. **ARN**: AWS 側で準備した IAM Role ARN を設定
3. **Encryption**: `SSE-S3` または `SSE-KMS`

### 5.2 AWS S3 バケットの Object Lock 有効化ポリシー (AC.5.3 / AC.10.1)
作成する S3 バケットには **Object Lock (COMPLIANCE モード)** を有効化し、ログの削除・改ざんを物理的に禁止します。

---

## 6. ステップ5: 開発環境 (Codespaces) ＆ Git設定

開発者の端末および Codespaces 上で機械的追跡を実現するための設定です。

### 6.1 Git コミットトレーラー自動付与 (AC.5.1)
コミット時に AI 協調作業タグ (`Co-Authored-By: GitHub Copilot`) を自動付与するためのフックを設定します。

**コマンド (Codespaces devcontainer.json または ローカル設定):**
```bash
git config --global commit.template ~/.gitmessage
echo -e "\n\nCo-Authored-By: GitHub Copilot <copilot@github.com>" > ~/.gitmessage
```

### 6.2 Codespaces Secrets と Actions Secrets の分離管理 (AC.12.2)
> **Settings** ➔ **Secrets and variables** ➔ **Codespaces**

* **`Codespaces secrets` に置くべきもの**: 個人開発用 PAT、開発・検証用テストAPIキー（例: `sk_test_...`）のみ。
* **`Actions secrets` に置くべきもの**: 本番AWS認証情報、デプロイ用特権鍵（Codespaces には絶対に共有・マウントしない）。

---

## 7. 動作検証チェックリスト

本ガイドに沿って設定完了後、以下のテストを実施して動作を検証してください。

- [ ] `.copilotignore` に指定したファイル（`test/fixtures/` 等）が Copilot Chat のコンテキストに読み込まれないことを確認
- [ ] `/src/auth/` や `.github/workflows/` の変更時に `CODEOWNERS` のレビューが必須化されることを確認
- [ ] PR作成時に `security-scan.yml` が全件自動実行され、`persist-credentials: false` で動作することを確認
- [ ] 悪意あるプロンプトを含む PR 説明文を作成した際、`bedrock-guardrails` ジョブが検知して CI をブロックすることを確認
- [ ] 本番 `main` ブランチャージ時に `Artifact Attestations` により SLSA プロベナンス署名が正常発行されることを確認
