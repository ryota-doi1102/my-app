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

### 必須チェック（001〜099）

#### name（氏名）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-001 | `name` を省略する | invalid / 氏名は必須項目です |
| TC-002 | `name` に空文字 `""` を指定する | invalid / 氏名は必須項目です |
| TC-003 | `name` に `null` を指定する | invalid（型エラー） |

#### birthDate（生年月日）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-004 | `birthDate` を省略する | invalid / 生年月日は必須項目です |
| TC-005 | `birthDate` に空文字 `""` を指定する | invalid / 生年月日は必須項目です |
| TC-006 | `birthDate` に `null` を指定する | invalid（型エラー） |

#### gender（性別）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-007 | `gender` を省略する | invalid / 性別は必須項目です |
| TC-008 | `gender` に `null` を指定する | invalid / 性別は必須項目です |

#### email（メールアドレス）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-009 | `email` を省略する | invalid / メールアドレスは必須項目です |
| TC-010 | `email` に空文字 `""` を指定する | invalid / メールアドレスは必須項目です |
| TC-011 | `email` に `null` を指定する | invalid（型エラー） |

#### password（パスワード）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-012 | `password` を省略する | invalid / パスワードは必須項目です |
| TC-013 | `password` に空文字 `""` を指定する | invalid / パスワードは必須項目です |
| TC-014 | `password` に `null` を指定する | invalid（型エラー） |

#### workHistories（職歴）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-015 | `workHistories` を省略する | invalid / 職歴を1件以上入力してください |
| TC-016 | `workHistories` に `null` を指定する | invalid（型エラー） |
| TC-017 | `workHistories` に空配列 `[]` を指定する | invalid / 職歴を1件以上入力してください |
| TC-018 | `workHistories[0].company` を省略する | invalid / 会社名は必須項目です |
| TC-019 | `workHistories[0].company` に空文字 `""` を指定する | invalid / 会社名は必須項目です |
| TC-020 | `workHistories[0].startMonth` を省略する | invalid / 在籍開始月は必須項目です |
| TC-021 | `workHistories[0].startMonth` に空文字 `""` を指定する | invalid / 在籍開始月は必須項目です |
| TC-022 | `workHistories[0].role` を省略する | invalid / 役職は必須項目です |
| TC-023 | `workHistories[0].role` に空文字 `""` を指定する | invalid / 役職は必須項目です |

#### agreedToTerms（利用規約への同意）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-024 | `agreedToTerms` を省略する | invalid / 利用規約・プライバシーポリシーへの同意が必要です |
| TC-025 | `agreedToTerms` に `null` を指定する | invalid / 利用規約・プライバシーポリシーへの同意が必要です |
| TC-026 | `agreedToTerms` に `false` を指定する | invalid / 利用規約・プライバシーポリシーへの同意が必要です |

---

### 形式・制約チェック（100〜499）

#### name（氏名）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-101 | `name` に 101 文字の文字列を指定する | invalid / 氏名は100文字以下で入力してください |

#### birthDate（生年月日）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-110 | `birthDate` に `YYYY-MM-DD` 以外の形式（例: `"2000/01/01"`）を指定する | invalid / 生年月日はYYYY-MM-DD形式で入力してください |
| TC-111 | `birthDate` に今日から 17 年前の日付を指定する（18歳未満） | invalid / 18歳未満の方は登録できません |
| TC-112 | `birthDate` に今日からちょうど 60 年前の日付を指定する（60歳） | invalid / 60歳以上の方は登録できません |

#### gender（性別）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-120 | `gender` に空文字 `""` を指定する | invalid / 性別の形式が正しくありません |
| TC-121 | `gender` に許可値以外（例: `"unknown"`）を指定する | invalid / 性別の形式が正しくありません |

#### profileImage（プロフィール画像）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-130 | `profileImage` に非対応 MIME タイプ（例: `image/gif`）のファイルを指定する | invalid / 対応していないファイル形式です |
| TC-131 | `profileImage` に 5MB を超えるファイルを指定する | invalid / ファイルサイズが上限を超えています |
| TC-132 | `profileImage` に空ファイル（サイズ 0）を指定する | invalid / ファイルが空です |

#### phone（電話番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-140 | `phone` にハイフンを含む値（例: `"090-1234-5678"`）を指定する | invalid / 電話番号にハイフンは使用できません（例: 09012345678） |
| TC-141 | `phone` に半角数字以外（例: `"０９０１２３４５６７８"`）を含む値を指定する | invalid / 電話番号は半角数字で入力してください |
| TC-142 | `phone` に 9 桁の数字（例: `"090123456"`）を指定する | invalid / 電話番号は10〜11桁で入力してください |
| TC-143 | `phone` に 12 桁の数字（例: `"090123456789"`）を指定する | invalid / 電話番号は10〜11桁で入力してください |

#### email（メールアドレス）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-150 | `email` にメール形式でない文字列（例: `"not-an-email"`）を指定する | invalid / メールアドレスはメールアドレス形式で入力してください |

#### password（パスワード）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-160 | `password` に 7 文字の文字列（例: `"Pass123"`）を指定する | invalid / パスワードは8文字以上で入力してください |
| TC-161 | `password` に大文字を含まない文字列（例: `"password1"`）を指定する | invalid / パスワードには大文字の英字を1文字以上含めてください |
| TC-162 | `password` に小文字を含まない文字列（例: `"PASSWORD1"`）を指定する | invalid / パスワードには小文字の英字を1文字以上含めてください |
| TC-163 | `password` に数字を含まない文字列（例: `"Passworddd"`）を指定する | invalid / パスワードには数字を1文字以上含めてください |

#### postalCode（郵便番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-170 | `postalCode` にハイフンを含む値（例: `"123-4567"`）を指定する | invalid / 郵便番号にハイフンは使用できません（例: 1234567） |
| TC-171 | `postalCode` に 6 桁の数字（例: `"123456"`）を指定する | invalid / 郵便番号は7桁で入力してください |
| TC-172 | `postalCode` に半角数字以外（例: `"ABC1234"`）を指定する | invalid / 郵便番号は半角数字で入力してください |

#### prefecture / city / streetAddress / building（住所）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-175 | `prefecture` に 51 文字の文字列を指定する | invalid / 都道府県は50文字以下で入力してください |
| TC-176 | `city` に 101 文字の文字列を指定する | invalid / 市区町村は100文字以下で入力してください |
| TC-177 | `streetAddress` に 256 文字の文字列を指定する | invalid / 番地は255文字以下で入力してください |
| TC-178 | `building` に 256 文字の文字列を指定する | invalid / 建物名・部屋番号は255文字以下で入力してください |

#### workHistories（職歴）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-180 | `workHistories[0].startMonth` に `YYYY-MM` 以外の形式（例: `"2020/04"`）を指定する | invalid / 在籍開始月はYYYY-MM形式で入力してください |
| TC-181 | `workHistories[0].endMonth` に `YYYY-MM` 以外の形式（例: `"2024/03"`）を指定する | invalid / 在籍終了月はYYYY-MM形式で入力してください |
| TC-182 | `workHistories[0].company` に 256 文字の文字列を指定する | invalid / 会社名は255文字以下で入力してください |
| TC-183 | `workHistories[0].role` に 256 文字の文字列を指定する | invalid / 役職は255文字以下で入力してください |

#### qualifications（資格）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-190 | `qualifications[0].value` に空文字 `""` を指定する | invalid / 資格名は必須項目です |

---

### 正常系バリエーション（500〜599）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-501 | 必須項目のみで valid になる | valid |
| TC-502 | `profileImage` を省略すると valid になる | valid |
| TC-503 | `profileImage` に `null` を指定すると valid になる | valid |
| TC-504 | `phone` を省略すると valid になる | valid |
| TC-505 | `phone` に空文字 `""` を指定すると valid になる | valid（空文字は桁数チェックをパスする） |
| TC-506 | `postalCode` を省略すると valid になる | valid |
| TC-507 | `postalCode` に空文字 `""` を指定すると valid になる | valid（空文字は桁数チェックをパスする） |
| TC-508 | `prefecture` を省略すると valid になる | valid |
| TC-509 | `city` を省略すると valid になる | valid |
| TC-510 | `streetAddress` を省略すると valid になる | valid |
| TC-511 | `building` を省略すると valid になる | valid |
| TC-512 | `workTypes` を省略すると valid になる | valid |
| TC-513 | `workTypes` に空配列 `[]` を指定すると valid になる | valid |
| TC-514 | `qualifications` を省略すると valid になる | valid |
| TC-515 | `qualifications` に空配列 `[]` を指定すると valid になる | valid |
| TC-516 | `selfPR` を省略すると valid になる | valid |
| TC-517 | `workHistories[0].endMonth` に `null` を指定すると valid になる（現職） | valid |
| TC-518 | `workHistories[0].endMonth` を省略すると valid になる | valid |
| TC-519 | すべての項目を指定すると valid になる | valid |

---

### API 変換（600〜699）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-601 | 必須項目のみで `createUserProfile` が呼ばれる | `createUserProfile` が正しい引数で呼ばれる |
| TC-602 | `profileImage` が `File` の場合 base64 に変換されて送信される | `profileImage` が base64 文字列になる |
| TC-602b | `profileImage` が未選択（初期状態）の場合、省略して送信される | `profileImage` が `undefined`（フィールド省略）になる |
| TC-603 | 削除ボタン押下（`profileImage` が `null`）の場合 `null` で送信される | `profileImage` が `null` になる |
| TC-604 | 任意文字列フィールド（`phone` / `postalCode` / `prefecture` / `city` / `streetAddress` / `building` / `selfPR`）が空文字 `""` の場合、`null` に変換されて送信される | `createUserProfile` が各フィールドを `null` として呼ばれる |
| TC-605 | 任意文字列フィールド（`phone` / `postalCode` / `prefecture` / `city` / `streetAddress` / `building` / `selfPR`）が省略（`undefined`）の場合、`null` に変換されて送信される | `createUserProfile` が各フィールドを `null` として呼ばれる |
| TC-606 | 送信成功後に `/users/list` へ遷移し snackbar メッセージが渡される | `navigate` が `"/users/list"` と `{ state: { snackbar: { severity: "success", message: "プロフィールを保存しました" } } }` で呼ばれる |

---

### API エラー処理（700〜799）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-701 | API エラー時に `apiError` にエラーメッセージがセットされる | `apiError` が `err.message` の値と一致する |
| TC-702 | メールアドレス重複エラーが返ってきたとき `apiError` にメッセージがセットされる | `apiError` が `"メールアドレスが既に登録されています"` になる |
| TC-703 | API エラー後に `isSubmitting` が `false` にリセットされる | `isSubmitting` が `false` になる |
