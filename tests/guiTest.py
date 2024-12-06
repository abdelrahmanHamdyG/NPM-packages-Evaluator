import os
import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

class FrontendTestSuite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # # Get the ChromeDriver path from environment variable
        # chromedriver_path = os.getenv('CHROMEDRIVER_PATH')
        # if not chromedriver_path:
        #     raise EnvironmentError("Please set the CHROMEDRIVER_PATH environment variable")
        
        # Set up Chrome options
        options = Options()
        options.add_argument('--headless')  # Run headless Chrome
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')

        # Set up WebDriver
        # service = Service(chromedriver_path)
        # cls.driver = webdriver.Chrome(service=service, options=options)
        cls.driver = webdriver.Chrome()
        cls.driver.get("http://3.15.13.78:3001/")  
    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def test_get_package_by_id(self):
        """Test the GET package/id functionality"""
        # Enter a valid package ID into the "Download Package" input
        package_id = "zero"  # Replace with a real package ID if necessary
        # download_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Package ID']")
        download_input = self.driver.find_element(By.XPATH, "//h3[text()='Download Package']/following-sibling::input")
        download_input.clear()
        download_input.send_keys(package_id)

        # Click the download button
        download_button = self.driver.find_element(By.XPATH, "//button[text()='Download']")
        download_button.click()

        # Wait for the download to be triggered
        time.sleep(2)

        # Check if the download has started (e.g., by verifying a success alert or other UI indicator)
        alert = self.driver.switch_to.alert
        alert_text = alert.text
        self.assertIn("Download started!", alert_text)
        alert.accept()

    def test_get_package_rating(self):
        """Test the GET package/id/rate functionality"""
        # Enter a valid package ID into the "Check Package Rating" input
        package_id = "zero"  # Replace with a real package ID if necessary
        rating_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Package ID']")
        rating_input.clear()
        rating_input.send_keys(package_id)

        # Click the "Check Rating" button
        check_rating_button = self.driver.find_element(By.XPATH, "//button[text()='Check Rating']")
        check_rating_button.click()

        # Wait for the result to appear
        time.sleep(2)

        # Check if the rating result is displayed
        rating_result = self.driver.find_element(By.TAG_NAME, 'pre').text
        self.assertIn("rating", rating_result)  # This should match part of your expected rating result

if __name__ == "__main__":
    unittest.main()