# 画面テスト仕様書規約

画面テスト仕様書を作成・変更する際に参照する規約。

テストコード実装規約は `/frontend-coding-rules` を参照。
詳細は `docs/rules/spec/screen-test-spec-rules.md` を参照。

---

## ファイル命名・配置

```
docs/tests/frontend/FE-USER-02.md
docs/tests/frontend/FE-USER-03.md
```

- ID 体系: `FE-{リソース}-{連番2桁}`
- 追加後は `docs/tests/frontend/_test_list.md` に記載する
- 新規作成時は `docs/tests/frontend/_template.md` をコピーして作成する

---

## 必須セクション

```markdown
# テスト仕様書 - FE-USER-02 ユーザープロフィール作成画面

## 対象

| 項目 | 内容 |
|---|---|
| ID | FE-USER-02 |
| 画面 | ユーザープロフィール作成 |
| パス | /users/create |
| スキーマ | `shared/schemas/user.ts` `userProfileCreateSchema` |
| フック | `frontend/src/pages/users/create/useUserCreateForm.ts` |
| テストコード（スキーマ） | `frontend/src/tests/schemas/user.test.ts` |
| テストコード（フック） | `frontend/src/tests/hooks/useUserCreateForm.test.ts` |

## テストケース一覧
```

同一スキーマを共有する複数画面（作成・編集）は別ファイルで作成し、差分のみ `## FE-XXX-YY との差分` セクションに記載する。

---

## TC 番号体系

| 範囲 | 区分 |
|---|---|
| 001〜099 | 必須チェック（フィールドの省略・空文字・null） |
| 100〜499 | 形式・制約チェック（形式・文字数・禁止文字・ビジネスルール等） |
| 500〜599 | 正常系バリエーション（バリデーションを通過するパターン） |
| 600〜699 | API 変換（フォームデータ → API パラメータ変換） |
| 700〜799 | API エラー処理（エラー時の状態・メッセージ） |

---

## 各セクションの標準 TC

### 必須チェック（001〜099）

フィールドごとに `####` サブセクションを設ける。

```markdown
#### name（氏名）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-001 | `name` を省略する | invalid / 氏名は必須項目です |
| TC-002 | `name` に空文字 `""` を指定する | invalid / 氏名は必須項目です |
| TC-003 | `name` に `null` を指定する | invalid（型エラー） |
```

### 形式・制約チェック（100〜499）

```markdown
#### birthDate（生年月日）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-110 | `birthDate` に YYYY-MM-DD 以外の形式を指定する | invalid / 生年月日はYYYY-MM-DD形式で入力してください |
| TC-111 | `birthDate` に 17 年前の日付を指定する | invalid / 18歳未満の方は登録できません |
```

### 正常系バリエーション（500〜599）

```markdown
| TC-501 | 必須項目のみで valid になる | valid |
| TC-502 | 任意フィールドを省略すると valid になる | valid |
| TC-503 | 任意フィールドに空文字を指定すると valid になる | valid |
| TC-504 | すべての項目を指定すると valid になる | valid |
```

### API 変換（600〜699）

```markdown
| TC-601 | 必須項目を入力して送信する | `createUserProfile` が正しい引数で呼ばれる |
| TC-602 | `profileImage` が `File` の場合 base64 に変換されて送信される | `profileImage` が base64 文字列になる |
| TC-603 | 任意文字列フィールドが空文字の場合 `null` に変換されて送信される | 各フィールドが `null` で API に渡る |
| TC-604 | 送信成功後に navigate が呼ばれる | `navigate("○○", { state: { snackbar: ... } })` が呼ばれる |
```

### API エラー処理（700〜799）

```markdown
| TC-701 | API がエラーを返す | `apiError` にエラーメッセージが設定される |
| TC-702 | 409 エラー時 | `apiError` が期待値と一致する |
| TC-703 | API エラー後 | `isSubmitting` が `false` に戻る |
```

---

## 期待するテスト結果の書き方

| 状況 | 書き方 |
|---|---|
| バリデーション成功 | `valid` |
| バリデーション失敗 | `invalid / {エラーメッセージ}` |
| 型エラー | `invalid（型エラー）` |
| API 呼び出し確認 | `{関数名}() が正しい引数で呼ばれる` |
| ページ遷移確認 | `navigate("○○") が呼ばれる` |

---

## 更新ルール

- TC を追加・変更したらテストコード（`frontend/src/tests/`）も同時に更新する
- テストコードを変更したら仕様書も同時に更新する
