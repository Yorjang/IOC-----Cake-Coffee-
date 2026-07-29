const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/components/AdminPanel.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The multi_replace_file_content earlier failed to replace chunks 5 and 6 because of line mismatches.
// So let's extract the `AdminBanners()` function and do targeted string replacements.

const startIdx = content.indexOf('function AdminBanners() {');
const endIdx = content.indexOf('\n// ── Revenue');
if (startIdx === -1 || endIdx === -1) {
    console.log("Could not find boundaries.");
    process.exit(1);
}

let bannersCode = content.substring(startIdx, endIdx);

// 1. Ensure position state exists
if (!bannersCode.includes('const [position, setPosition]')) {
    bannersCode = bannersCode.replace(
        'const [subtitle, setSubtitle] = useState("");',
        'const [subtitle, setSubtitle] = useState("");\n  const [position, setPosition] = useState("home_main");'
    );
}

// 2. Ensure position is in handleEdit
if (bannersCode.includes('handleEdit') && !bannersCode.includes('setPosition(')) {
    bannersCode = bannersCode.replace(
        'setSubtitle(banner.subtitle || "");',
        'setSubtitle(banner.subtitle || "");\n    setPosition(banner.position || "home_main");'
    );
}

// 3. Ensure position in handleCreate payload
if (!bannersCode.includes('position,')) {
    bannersCode = bannersCode.replace(
        'subtitle,',
        'subtitle,\n          position,'
    );
}

// 4. Ensure position reset in handleCreate success
if (!bannersCode.includes('setPosition("home_main")')) {
    bannersCode = bannersCode.replace(
        'setSubtitle("");',
        'setSubtitle("");\n        setPosition("home_main");'
    );
}

// 5. Add select dropdown in the form (before imageUrl)
if (!bannersCode.includes('<select\n                className="w-full rounded-xl bg-sidebar-accent')) {
    const subtitleInput = '<textarea className="sm:col-span-2 min-h-20 rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent" placeholder={"M\\u00f4 t\\u1ea3 ng\\u1eafn hi\\u1ec3n th\\u1ecb d\\u01b0\\u1edbi ti\\u00eau \\u0111\\u1ec1"} value={subtitle} onChange={e => setSubtitle(e.target.value)} />';
    
    const subtitleReplacement = subtitleInput + `\n            <div className="sm:col-span-2">
              <select
                className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
                value={position}
                onChange={e => setPosition(e.target.value)}
              >
                <option value="home_main">Banner chính (Trang chủ)</option>
                <option value="footer">Ảnh nền Footer</option>
                <option value="app_popup">Popup Ứng dụng</option>
              </select>
            </div>`;
    
    bannersCode = bannersCode.replace(subtitleInput, subtitleReplacement);
}

// 6. Display position in the card
if (!bannersCode.includes('b.position === \'footer\'')) {
    const sortOrderDisplay = '<p className="mt-1 text-xs text-muted-foreground">Thứ tự hiển thị: {b.sortOrder}</p>';
    const positionDisplay = sortOrderDisplay + `\n                  <p className="mt-1 text-xs font-semibold text-primary">
                    {b.position === 'footer' ? 'Vị trí: Ảnh nền Footer' : b.position === 'app_popup' ? 'Vị trí: Popup Ứng dụng' : 'Vị trí: Banner chính'}
                  </p>`;
    bannersCode = bannersCode.replace(sortOrderDisplay, positionDisplay);
}

content = content.substring(0, startIdx) + bannersCode + content.substring(endIdx);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched AdminBanners successfully!");
