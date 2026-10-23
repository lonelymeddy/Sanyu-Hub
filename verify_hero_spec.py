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

        # Confirm extra collaboration banner below hero does NOT exist
        banner = page.query_selector(".hero-collaboration-banner")
        assert banner is None, "Extra hero collaboration banner should not exist below the hero!"

        # Confirm collaboration slide exists in carousel track (slide 6 / data-slide 5)
        collab_slide = page.query_selector(".carousel-slide[data-slide='5']")
        assert collab_slide is not None, "Hero collaboration slide 6 not found in hero carousel!"

        badge = collab_slide.query_selector(".hero-badge .ugandan-text")
        assert badge and badge.text_content().strip() == "LET'S BUILD TOGETHER", f"Badge mismatch: {badge.text_content() if badge else None}"

        heading = collab_slide.query_selector("h1")
        assert heading and heading.text_content().strip() == "Let's create something amazing together.", f"Heading mismatch: {heading.text_content() if heading else None}"

        desc = collab_slide.query_selector(".hero-description")
        assert desc and "Want to collaborate with sanyuhub, sponsor our platform, or become a partner?" in desc.text_content(), f"Desc mismatch: {desc.text_content() if desc else None}"

        btn = collab_slide.query_selector(".btn-get-started")
        assert btn and btn.get_attribute("href") == "https://sanyuhub.vercel.app/contact", f"Button href mismatch: {btn.get_attribute('href') if btn else None}"

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
