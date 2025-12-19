# 🚀 運用・デプロイ手順書

## 1. 概要
このシステムは **Supabase** (データベース/認証) と **React** (フロントエンド) で構成されています。
マルチテナントに対応しており、Supabaseに登録されたユーザーIDごとにデータが完全に分離されます。

---

## 2. GitHub Pages へのデプロイ（推奨）
GitHub Actionsの設定ファイル（`.github/workflows/static.yml`）が含まれているため、**GitHubへプッシュするだけで自動的に公開**されます。

### 手順
1. VS Code等のターミナルを開く。
2. 変更をコミットしてプッシュする。
   ```bash
   git add .
   git commit -m "本番リリース"
   git push