from playwright.sync_api import sync_playwright

def verify_hero():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Desktop viewport
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://localhost:3000/index.html")
        page.wait_for_timeout(1000)

        # Check all slides exist
        slides = page.query_selector_all(".carousel-slide")
        print(f"Total carousel slides: {len(slides)}")
        assert len(slides) == 6, f"Expected 6 slides, got {len(slides)}"

        # Check collaboration banner elements
        banner = page.query_selector(".hero-collaboration-banner")
        assert banner is not None, "Hero collaboration banner not found!"

        badge = page.query_selector(".collaboration-text-content .ugandan-text")
        assert badge and badge.inner_text().strip() == "LET'S BUILD TOGETHER", f"Badge mismatch: {badge.inner_text() if badge else None}"

        heading = page.query_selector(".collaboration-heading")
        assert heading and heading.inner_text().strip() == "Let's create something amazing together.", f"Heading mismatch: {heading.inner_text() if heading else None}"

        desc = page.query_selector(".collaboration-description")
        assert desc and "Want to collaborate with sanyuhub, sponsor our platform, or become a partner?" in desc.inner_text(), f"Desc mismatch: {desc.inner_text() if desc else None}"

        btn = page.query_selector(".collaboration-actions .btn-get-started")
        assert btn and btn.get_attribute("href") == "https://sanyuhub.vercel.app/contact", f"Button href mismatch: {btn.get_attribute('href') if btn else None}"

        img = page.query_selector(".collaboration-image")
        assert img and "/images/hero-collaboration.png" in img.get_attribute("src"), "Image src mismatch"

        page.screenshot(path="verification_desktop.png", full_page=False)
        print("Desktop verification passed!")

        # 2. Mobile viewport (iPhone 12 / Android mobile)
        mobile_page = browser.new_page(viewport={"width": 390, "height": 844})
        mobile_page.goto("http://localhost:3000/index.html")
        mobile_page.wait_for_timeout(1000)

        mobile_page.screenshot(path="verification_mobile.png", full_page=False)
        print("Mobile verification passed!")

        browser.close()

if __name__ == "__main__":
    verify_hero()
