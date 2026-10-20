import sys, os
from playwright.sync_api import sync_playwright

script_dir = os.path.dirname(os.path.abspath(__file__))
screenshot_dir = os.path.join(script_dir, "screenshots")
video_dir = os.path.join(script_dir, "videos")
os.makedirs(screenshot_dir, exist_ok=True)
os.makedirs(video_dir, exist_ok=True)

def run_verification(page):
    page.goto("http://localhost:3000/movies/")
    page.wait_for_timeout(1000)

    series_btn = page.locator("#vjCategories button[data-category='series']")
    if series_btn.is_visible():
        series_btn.click()
        page.wait_for_timeout(1000)

    concerts_btn = page.locator("#vjCategories button[data-category='concerts']")
    if concerts_btn.is_visible():
        concerts_btn.click()
        page.wait_for_timeout(1000)

    movies_btn = page.locator("#vjCategories button[data-category='movies']")
    if movies_btn.is_visible():
        movies_btn.click()
        page.wait_for_timeout(1000)

    page.screenshot(path=os.path.join(screenshot_dir, "library.png"))
    page.wait_for_timeout(1000)

    page.goto("http://localhost:3000/live-tv/")
    page.wait_for_timeout(1000)

    matches_btn = page.locator("#channelTypeSelector button[data-type='matches']")
    if matches_btn.is_visible():
        matches_btn.click()
        page.wait_for_timeout(1000)

    crusades_btn = page.locator("#channelTypeSelector button[data-type='crusades']")
    if crusades_btn.is_visible():
        crusades_btn.click()
        page.wait_for_timeout(1000)

    tv_btn = page.locator("#channelTypeSelector button[data-type='tv']")
    if tv_btn.is_visible():
        tv_btn.click()
        page.wait_for_timeout(1000)

    page.screenshot(path=os.path.join(screenshot_dir, "channels.png"))
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir=video_dir)
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
