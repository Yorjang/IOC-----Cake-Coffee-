---
name: git-workflow
description: >
  Chuẩn mực quản lý mã nguồn bằng Git cho dự án. Bao gồm mô hình nhánh, quy tắc
  commit theo Conventional Commits, quy trình Pull Request, Code Review, chiến
  lược merge và cách đánh version (SemVer). Áp dụng cho toàn bộ team để giữ
  lịch sử commit sạch, dễ trace và dễ review.
---

# Git Workflow Conventions

Tài liệu này định nghĩa cách cả team làm việc với Git. Mục tiêu:

- **Nhất quán**: mọi người commit, đặt tên nhánh và tạo PR theo cùng một chuẩn.
- **Dễ trace**: nhìn vào lịch sử là hiểu được *cái gì* thay đổi và *tại sao*.
- **An toàn**: nhánh production luôn ở trạng thái deploy được.

> Quy tắc vàng: **không bao giờ commit hay force-push trực tiếp lên `main` và `develop`.** Mọi thay đổi phải đi qua Pull Request.

---

## 1. Mô hình nhánh (Branching Model)

Team dùng mô hình dạng Git Flow rút gọn với các nhánh sau:

| Nhánh          | Vai trò                                         | Tách ra từ | Merge vào         | Xóa sau merge |
| -------------- | ----------------------------------------------- | ---------- | ----------------- | ------------- |
| `main`         | Code production, luôn ổn định và deploy được    | —          | —                 | Không         |
| `develop`      | Code tích hợp đang phát triển                   | `main`     | —                 | Không         |
| `feature/*`    | Phát triển tính năng mới                         | `develop`  | `develop`         | Có            |
| `bugfix/*`     | Sửa lỗi phát hiện trong quá trình phát triển    | `develop`  | `develop`         | Có            |
| `release/*`    | Chuẩn bị phát hành một phiên bản                 | `develop`  | `main` + `develop`| Có            |
| `hotfix/*`     | Sửa lỗi khẩn cấp trên production                 | `main`     | `main` + `develop`| Có            |

### 1.1. Quy tắc đặt tên nhánh

Dùng chữ thường, phân tách bằng dấu gạch nối, thêm mã ticket (nếu có) để dễ trace:

```
feature/<mã-ticket>-<mô-tả-ngắn>
bugfix/<mã-ticket>-<mô-tả-ngắn>
```

Ví dụ:

```
feature/CHAT-142-streaming-response
feature/message-feedback-buttons
bugfix/SIDE-88-conversation-rename-crash
hotfix/prod-upload-timeout
release/v1.4.0
```

**Nên**: ngắn gọn, mô tả đúng phạm vi công việc.
**Không nên**: `feature/fix`, `feature/new`, `my-branch`, tên có dấu tiếng Việt hoặc khoảng trắng.

### 1.2. Luồng làm việc tổng quát

```
main ────●───────────────────────●──────────────●─────►  (production)
          \                      /                \
develop ───●────●────●────●─────●──────●────●──────●───►  (tích hợp)
                \        /              \        /
feature/*        ●──────●                        (release/*)
                                        \
                                         ●─── hotfix/* ──► main + develop
```

- Ngày thường: tách `feature/*` hoặc `bugfix/*` từ `develop`, làm xong tạo PR về `develop`.
- Khi phát hành: tách `release/*` từ `develop`, chỉ sửa lỗi/finalize trên đó, rồi merge vào cả `main` và `develop`.
- Sự cố production: tách `hotfix/*` từ `main`, sửa xong merge vào cả `main` và `develop` để không bị mất fix.

---

## 2. Commit Messages (Conventional Commits)

### 2.1. Cấu trúc

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **Bắt buộc**: dòng đầu tiên (`<type>(<scope>): <subject>`).
- **Tùy chọn**: `body` (giải thích lý do/cách làm) và `footer` (breaking change, tham chiếu issue).
- Giữa các phần cách nhau bằng **một dòng trống**.

### 2.2. Các `type` hợp lệ

| Type       | Dùng khi                                                       |
| ---------- | -------------------------------------------------------------- |
| `feat`     | Thêm tính năng mới                                             |
| `fix`      | Sửa lỗi                                                        |
| `docs`     | Chỉ thay đổi tài liệu (README, comment...)                    |
| `style`    | Format code, không đổi logic (khoảng trắng, dấu chấm phẩy)     |
| `refactor` | Tái cấu trúc code, không thêm tính năng cũng không sửa lỗi     |
| `perf`     | Cải thiện hiệu năng                                            |
| `test`     | Thêm hoặc sửa test                                            |
| `build`    | Thay đổi hệ thống build hoặc dependency (Vite, package.json)   |
| `ci`       | Thay đổi cấu hình CI/CD                                        |
| `chore`    | Việc lặt vặt khác (cấu hình, dọn dẹp) không thuộc các loại trên|
| `revert`   | Hoàn tác một commit trước đó                                   |

### 2.3. `scope`

`scope` cho biết phần nào của hệ thống bị ảnh hưởng. Với dự án hiện tại, một số scope gợi ý:

```
chat, sidebar, sources, documents, account,
markdown, hooks, tokens, layout, api
```

Nếu thay đổi trải rộng nhiều phần, có thể bỏ scope: `refactor: extract shared list styles`.

### 2.4. Quy tắc cho `subject`

- Dùng **thể mệnh lệnh, thì hiện tại**: "add", "fix", "remove" — không phải "added", "adds".
- **Không** viết hoa chữ cái đầu, **không** kết thúc bằng dấu chấm.
- Giữ dưới ~50 ký tự; body dùng để giải thích thêm nếu cần.

### 2.5. Breaking change

Đánh dấu bằng `!` sau type/scope, và/hoặc ghi rõ ở footer:

```
feat(api)!: đổi định dạng response của useChat

BREAKING CHANGE: `useChat` giờ trả về `{ messages, status }`
thay vì mảng messages. Các component gọi hook cần cập nhật.
```

### 2.6. Ví dụ

**Tốt:**

```
feat(chat): add streaming mock response via setTimeout
fix(sidebar): tránh crash khi rename conversation rỗng
refactor(hooks): tách useDocuments khỏi useChat
docs: bổ sung hướng dẫn cấu trúc component
chore(build): nâng Vite lên 5.x
```

**Nên tránh:**

```
update code            # không có type, không rõ nghĩa
Fix bug.               # viết hoa, có dấu chấm, không rõ bug gì
feat: sửa nhiều thứ    # phạm vi mơ hồ, gộp nhiều việc
```

---

## 3. Pull Requests (PR)

### 3.1. Nguyên tắc

- **Nhỏ và tập trung**: mỗi PR giải quyết đúng một vấn đề (Single Responsibility). PR càng nhỏ càng dễ review và ít lỗi.
- **Tự review trước**: đọc lại toàn bộ diff của chính mình trước khi mở PR — xóa `console.log`, code thừa, `// TODO` không liên quan.
- **CI phải xanh**: lint, type-check và test phải pass trước khi xin review.
- **Không merge PR của chính mình** khi chưa có ít nhất một approve (trừ trường hợp khẩn cấp đã thống nhất trước).

### 3.2. Tiêu đề PR

Theo cùng chuẩn Conventional Commits với commit:

```
feat(documents): thêm panel upload tài liệu
```

### 3.3. Mẫu mô tả PR

```markdown
## Mục tiêu
Ngắn gọn PR này làm gì và vì sao.

## Thay đổi chính
- ...
- ...

## Cách kiểm thử
Các bước để reviewer tự kiểm tra tại local.

## Ảnh chụp màn hình (nếu là thay đổi UI)
...

## Checklist
- [ ] Đã tự review diff
- [ ] Lint & type-check pass
- [ ] Đã test các luồng liên quan
- [ ] Cập nhật tài liệu (nếu cần)
- [ ] Không còn `console.log` / code debug thừa
```

---

## 4. Code Review

Người review nên tập trung vào:

- **Tính đúng đắn**: logic có xử lý đúng edge case không?
- **Khả năng đọc**: người khác đọc có hiểu ngay không? Tên biến/hàm rõ ràng chứ?
- **Nhất quán**: đúng convention của dự án (CSS Modules, cấu trúc `Component.tsx / .module.css / index.ts`)?
- **Phạm vi**: PR có bị "gánh" thêm thay đổi ngoài lề không?

Quy tắc ứng xử:

- Comment mang tính xây dựng, gợi ý thay vì ra lệnh; giải thích *tại sao*.
- Phân biệt góp ý bắt buộc và góp ý tùy chọn (ví dụ prefix `nit:` cho việc nhỏ, không chặn merge).
- Tác giả PR nên phản hồi (fix hoặc giải thích) từng comment trước khi merge.

---

## 5. Chiến lược Merge

- **`feature/*`, `bugfix/*` → `develop`**: dùng **Squash and Merge** để giữ lịch sử `develop` gọn (mỗi tính năng thành một commit sạch).
- **`release/*`, `hotfix/*` → `main`**: dùng **Merge commit** để bảo toàn ngữ cảnh phát hành.
- Ưu tiên **rebase nhánh của bạn lên `develop`** trước khi mở/merge PR để tránh conflict và giữ lịch sử thẳng.
- **Không force-push** lên nhánh dùng chung. Chỉ được rebase/force-push trên nhánh cá nhân của mình.

Sau khi merge: **xóa nhánh** feature/bugfix để repo gọn gàng.

---

## 6. Versioning & Tags (SemVer)

Đánh version theo [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: thay đổi phá vỡ tương thích (breaking change).
- **MINOR**: thêm tính năng mới, vẫn tương thích ngược.
- **PATCH**: sửa lỗi, vẫn tương thích ngược.

Mỗi lần merge `release/*` hoặc `hotfix/*` vào `main` thì tạo tag tương ứng:

```
git tag -a v1.4.0 -m "release: v1.4.0"
git push origin v1.4.0
```

---

## 7. Quy tắc chung

- Commit **thường xuyên, theo từng đơn vị logic** — đừng gom cả ngày làm việc vào một commit.
- Không commit file bí mật (`.env`, key, token) hay file build (`dist/`, `node_modules/`) — đảm bảo `.gitignore` đã bao phủ.
- Pull `develop` mới nhất trước khi bắt đầu nhánh mới để giảm conflict.
- Nếu chưa xong nhưng cần chuyển việc: dùng `git stash` hoặc commit nháp với prefix `wip:` (và squash lại trước khi mở PR).

---

## 8. Tạm cất công việc với `git stash`

Dùng khi đang làm dở nhưng cần chuyển sang việc khác (sửa gấp trên nhánh khác, pull code mới...) mà chưa muốn commit.

```bash
git stash                       # cất toàn bộ thay đổi đã track, trả working dir về sạch
git stash -m "wip: chat panel"  # cất kèm mô tả để dễ nhận ra sau này
git stash -u                    # cất cả file chưa track (untracked)
git stash -k                    # giữ lại phần đã "git add", chỉ cất phần còn lại

git stash list                  # xem danh sách các stash đang có
git stash show -p stash@{0}     # xem chi tiết diff của một stash

git stash pop                   # lấy stash mới nhất ra và xóa nó khỏi danh sách
git stash apply stash@{1}       # lấy một stash cụ thể ra nhưng vẫn giữ trong danh sách
git stash drop stash@{0}        # xóa một stash cụ thể
git stash clear                 # xóa toàn bộ stash
```

Tình huống điển hình:

```bash
# Đang làm dở feature thì có hotfix gấp
git stash -u -m "wip: feature dashboard"
git checkout main
# ... xử lý hotfix ...
git checkout feature/dashboard
git stash pop                   # tiếp tục công việc đang dở
```

> **Lưu ý**: stash chỉ nằm ở local, không được push lên remote. Đừng cất việc quan trọng trong stash quá lâu — dễ quên. Với việc cần lưu lâu, hãy commit `wip:` trên nhánh cá nhân.

---

## 9. Xem lịch sử với `git log`

```bash
git log --oneline                       # mỗi commit gọn trong một dòng (hash ngắn + subject)
git log --oneline --graph --all         # xem cây nhánh trực quan, tất cả các nhánh
git log --oneline -10                   # 10 commit gần nhất
git log --oneline --decorate            # hiển thị kèm tên nhánh/tag

git log --stat                          # kèm danh sách file thay đổi + số dòng +/-
git log -p                              # kèm nội dung diff của từng commit
git log --author="Jeezzy"               # lọc theo tác giả
git log --since="2 weeks ago"           # lọc theo thời gian
git log --grep="chat"                   # tìm commit theo nội dung message
git log develop..feature/x              # các commit có ở feature/x mà develop chưa có
git log -- src/hooks/useChat.ts         # lịch sử thay đổi của riêng một file
```

Một alias `log` đẹp và hay dùng (xem thêm mục 12):

```bash
git log --oneline --graph --decorate --all
```

Xem *ai* đổi *dòng nào* trong file:

```bash
git blame src/hooks/useChat.ts          # gắn mỗi dòng với commit + tác giả tương ứng
git show <hash>                         # xem chi tiết một commit cụ thể
```

---

## 10. Sửa & dọn lịch sử

Chỉ áp dụng cho **nhánh cá nhân chưa merge**. Không viết lại lịch sử của `main` / `develop` hay nhánh người khác đang dùng.

```bash
git commit --amend                      # sửa commit gần nhất (đổi message hoặc thêm file)
git commit --amend --no-edit            # thêm file vào commit gần nhất, giữ nguyên message

git rebase -i HEAD~4                     # rebase tương tác 4 commit gần nhất
```

Trong màn hình rebase tương tác, đổi từ khóa đầu mỗi dòng:

| Lệnh     | Ý nghĩa                                  |
| -------- | ---------------------------------------- |
| `pick`   | giữ nguyên commit                        |
| `reword` | giữ commit, sửa lại message              |
| `squash` | gộp vào commit phía trên, gộp cả message |
| `fixup`  | gộp vào commit phía trên, bỏ message     |
| `drop`   | xóa hẳn commit                           |

Dùng để gom nhiều commit `wip:` thành một commit sạch trước khi mở PR.

---

## 11. Hoàn tác & khôi phục

```bash
# Bỏ thay đổi ở working directory (chưa add)
git restore src/App.tsx                 # trả file về trạng thái commit gần nhất
git restore .                           # trả tất cả file về trạng thái đã commit

# Bỏ khỏi staging (đã add, muốn unstage)
git restore --staged src/App.tsx

# Reset con trỏ nhánh
git reset --soft HEAD~1                  # bỏ commit gần nhất, GIỮ thay đổi ở staging
git reset --mixed HEAD~1                 # bỏ commit gần nhất, GIỮ thay đổi ở working dir (mặc định)
git reset --hard HEAD~1                  # bỏ commit gần nhất VÀ xóa luôn thay đổi (cẩn thận!)

# Hoàn tác một commit đã push (an toàn cho nhánh chung)
git revert <hash>                        # tạo commit mới đảo ngược commit cũ

# "Phao cứu sinh": xem lại mọi vị trí HEAD đã đi qua
git reflog                               # tìm lại commit tưởng đã mất rồi reset về đó
```

> `reset --hard` và `push --force` là hai lệnh dễ gây mất code nhất. Trước khi dùng, chắc chắn bạn đang ở nhánh cá nhân và đã hiểu hậu quả. Nếu lỡ tay, `git reflog` thường cứu được.

---

## 12. Một số lệnh & alias hữu ích khác

```bash
git cherry-pick <hash>                  # bê một commit cụ thể từ nhánh khác sang nhánh hiện tại
git diff                                # xem thay đổi chưa staged
git diff --staged                       # xem thay đổi đã staged
git switch develop                      # đổi nhánh (bản mới, rõ nghĩa hơn checkout)
git switch -c feature/x                 # tạo và chuyển sang nhánh mới
git bisect start                        # nhị phân tìm commit gây lỗi (bisect good/bad)
```

Cấu hình vài alias cho gõ nhanh:

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global alias.last "log -1 HEAD"
```

Sau đó dùng: `git st`, `git lg`, `git last`...

---

## 13. Ví dụ quy trình end-to-end

```bash
# 1. Cập nhật develop và tạo nhánh tính năng
git checkout develop
git pull origin develop
git checkout -b feature/CHAT-142-streaming-response

# 2. Làm việc và commit theo chuẩn
git add src/hooks/useChat.ts
git commit -m "feat(chat): add streaming mock response via setTimeout"

# 3. Đồng bộ với develop mới nhất
git fetch origin
git rebase origin/develop

# 4. Push và mở Pull Request về develop
git push -u origin feature/CHAT-142-streaming-response

# 5. Sau khi được approve và merge (squash), xóa nhánh
git checkout develop
git pull origin develop
git branch -d feature/CHAT-142-streaming-response
```
