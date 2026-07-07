const fs = require('fs');
const path = require('path');

function refactor() {
    const filePath = path.join(__dirname, 'src', 'app', 'App.tsx');
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // 1. Insert imports after mockData import
    const imports = `import { Btn, ProductCard, Section } from "./components/shared";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MESSAGES } from "../constants/messages";
`;
    content = content.replace('import { categories, products, navPages, heroBanners } from "../data/mockData";',
                              'import { categories, products, navPages, heroBanners } from "../data/mockData";\n' + imports);

    // 2. Delete the definitions of Btn, ProductCard, Header, Footer, Section
    const startStr = "// ── Shared components ─────────────────────────────────────────────────────────\nfunction Btn";
    const endStr = "    </section>\n  );\n}\n";
    
    const startIdx = content.indexOf(startStr);
    const endIdx = content.indexOf(endStr, startIdx) + endStr.length;
    
    if (startIdx !== -1 && endIdx !== -1) {
        content = content.substring(0, startIdx) + content.substring(endIdx);
    } else {
        console.log("Could not find block to replace.");
    }

    // 3. Replace hardcoded text in Home component
    content = content.replace("Sweet Bean Coffee & Cake", "{MESSAGES.APP_NAME || 'Sweet Bean Coffee & Cake'}");
    
    const heroTitle = "Bánh tươi mỗi ngày,<br />Cafe thơm ngon.";
    content = content.replace(heroTitle, "{MESSAGES.HERO_TITLE.split('\\n').map((line, i) => <span key={i}>{line}<br /></span>)}");
    
    const heroSub = "Giao tận nơi trong 2 giờ — Nướng mới mỗi sáng — Đóng gói quà tặng.";
    content = content.replace(heroSub, "{MESSAGES.HERO_SUBTITLE}");
    
    content = content.replace("Đặt bánh ngay", "{MESSAGES.HERO_BUTTON_ORDER}");
    content = content.replace("Khám phá cafe", "{MESSAGES.HERO_BUTTON_EXPLORE}");
    
    const flashSale = "Flash sale 14:00 hôm nay — Giảm 20% cafe khi mua cùng bánh. Dùng mã";
    content = content.replace(flashSale, "{MESSAGES.FLASH_SALE_TEXT}");

    content = content.replace('title="Danh mục nổi bật" sub="Chọn món yêu thích của bạn"', 'title={MESSAGES.SECTION_CATEGORIES_TITLE} sub={MESSAGES.SECTION_CATEGORIES_SUB}');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Refactoring complete.");
}

refactor();
