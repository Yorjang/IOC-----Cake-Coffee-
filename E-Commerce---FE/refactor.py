import re

def refactor():
    with open('d:/working/coding/frontend/src/app/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Insert imports after mockData import
    imports = """import { Btn, ProductCard, Section } from "./components/shared";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MESSAGES } from "../constants/messages";
"""
    content = content.replace('import { categories, products, navPages, heroBanners } from "../data/mockData";',
                              'import { categories, products, navPages, heroBanners } from "../data/mockData";\n' + imports)

    # 2. Delete the definitions of Btn, ProductCard, Header, Footer, Section
    # Find the start of Btn and the end of Section
    start_str = "// ── Shared components ─────────────────────────────────────────────────────────\nfunction Btn"
    end_str = "    </section>\n  );\n}\n"
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str, start_idx) + len(end_str)
    
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + content[end_idx:]

    # 3. Replace hardcoded text in Home component
    content = content.replace("Sweet Bean Coffee & Cake", "{MESSAGES.APP_NAME || 'Sweet Bean Coffee & Cake'}")
    
    hero_title = "Bánh tươi mỗi ngày,<br />Cafe thơm ngon."
    content = content.replace(hero_title, "{MESSAGES.HERO_TITLE.split('\\n').map((line, i) => <span key={i}>{line}<br /></span>)}")
    
    hero_sub = "Giao tận nơi trong 2 giờ — Nướng mới mỗi sáng — Đóng gói quà tặng."
    content = content.replace(hero_sub, "{MESSAGES.HERO_SUBTITLE}")
    
    content = content.replace("Đặt bánh ngay", "{MESSAGES.HERO_BUTTON_ORDER}")
    content = content.replace("Khám phá cafe", "{MESSAGES.HERO_BUTTON_EXPLORE}")
    
    flash_sale = "Flash sale 14:00 hôm nay — Giảm 20% cafe khi mua cùng bánh. Dùng mã"
    content = content.replace(flash_sale, "{MESSAGES.FLASH_SALE_TEXT}")

    content = content.replace('title="Danh mục nổi bật" sub="Chọn món yêu thích của bạn"', 'title={MESSAGES.SECTION_CATEGORIES_TITLE} sub={MESSAGES.SECTION_CATEGORIES_SUB}')

    with open('d:/working/coding/frontend/src/app/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Refactoring complete.")

if __name__ == "__main__":
    refactor()
