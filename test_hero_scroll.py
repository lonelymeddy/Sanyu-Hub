from playwright.sync_api import sync_playwright

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 393, "height": 852},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()
        page.goto("http://localhost:3000")
        page.wait_for_timeout(1000)
        page.screenshot(path="hero_top.png")

        page.evaluate("window.scrollBy(0, 200)")
        page.wait_for_timeout(500)
        page.screenshot(path="hero_scroll200.png")
        context.close()
        browser.close()
