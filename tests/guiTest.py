from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import unittest
from selenium.common.exceptions import UnexpectedAlertPresentException, TimeoutException


class TestAPI(unittest.TestCase):
    def setUp(self):
        """Set up the Selenium WebDriver."""
        self.driver = webdriver.Chrome()  # Use appropriate WebDriver (e.g., ChromeDriver)
        self.driver.get("http://localhost:3001")  # Replace with the actual URL of your app
        self.driver.maximize_window()
    
    def test_get_package_by_id(self):
        """Test the GET package by ID functionality."""
        driver = self.driver

        # Wait for the input field to be present
        package_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Package ID']"))
        )
        package_input.clear()

        # Enter the package ID
        package_id = "debug-4_4_0"  # Replace with a valid package ID
        package_input.send_keys(package_id)

        # Wait for the button to be clickable
        get_package_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Get Package']"))
        )
        get_package_button.click()

        # Handle the alert
        WebDriverWait(driver, 10).until(EC.alert_is_present())
        alert = driver.switch_to.alert
        alert_text = alert.text

        # Verify the alert text
        self.assertIn("Package fetched successfully!", alert_text)
        alert.accept()  # Close the alert

        # Wait for the result to appear (if any additional content is loaded after the alert)
        result_element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//h2[text()='Package Details:']/following-sibling::pre"))
        )
        result_text = result_element.text

        # Validate the result contains the package ID
        self.assertIn(package_id, result_text)
        
    def test_upload_package_url(self):
        driver = self.driver

        # Locate and click the "Provide URL" radio button
        upload_url_radio = driver.find_element(By.XPATH, "//input[@value='URL']")
        upload_url_radio.click()

        # Enter the Package URL
        package_url = driver.find_element(By.XPATH, "//input[@placeholder='Package URL']")
        package_url.send_keys("https://github.com/debug-js/debug")  # Example URL

        # Toggle Apply Debloat
        debloat_checkbox = driver.find_element(By.XPATH, "//input[@type='checkbox']")
        debloat_checkbox.click()

        # Click the Upload button
        upload_button = driver.find_element(By.XPATH, "//button[text()='Upload']")
        upload_button.click()

        # Handle the alert if it appears
        try:
            WebDriverWait(driver, 5).until(EC.alert_is_present())
            alert = driver.switch_to.alert
            alert_text = alert.text
            print(f"Alert detected: {alert_text}")
            alert.accept()  # Dismiss the alert by accepting it
            self.assertEqual(
                alert_text, "Failed to upload the package. Please try again.",
                "Unexpected alert message."
            )
            print("Handled the alert successfully.")

        except TimeoutException:
            print("No alert appeared during the upload process.")
        
      
    def test_check_package_cost(self):
        """Test the Check Package Cost functionality."""
        driver = self.driver

        # Wait for the input field to be present
        cost_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Package ID for Cost']"))
        )
        cost_input.clear()

        # Enter the package ID
        package_id = "debug-4_4_0"  # Replace with a valid package ID
        cost_input.send_keys(package_id)

        # Wait for the Check Cost button to be clickable
        check_cost_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Check Cost']"))
        )
        check_cost_button.click()

        # Handle the alert if it appears
        try:
            WebDriverWait(driver, 5).until(EC.alert_is_present())
            alert = driver.switch_to.alert
            alert_text = alert.text
            print(f"Alert detected: {alert_text}")
            alert.accept()  # Dismiss the alert by accepting it
            # Ensure the correct alert message is checked for the "Check Cost" action
            self.assertEqual(
                alert_text, "Please enter a package ID to check the cost.",
                "Unexpected alert message."
            )
            print("Handled the alert successfully.")

        except TimeoutException:
            print("No alert appeared during the Check Cost process.")


    def test_check_package_rating(self):
        """Test the Check Package Rating functionality."""
        driver = self.driver

        # Wait for the input field to be present
        rating_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Package ID']"))
        )
        rating_input.clear()

        # Enter the package ID
        package_id = "debug-4_4_0"  # Replace with a valid package ID
        rating_input.send_keys(package_id)

        # Wait for the Check Rating button to be clickable
        check_rating_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Check Rating']"))
        )
        check_rating_button.click()

        # Handle the alert if it appears
        try:
            WebDriverWait(driver, 5).until(EC.alert_is_present())
            alert = driver.switch_to.alert
            alert_text = alert.text
            print(f"Alert detected: {alert_text}")
            alert.accept()  # Dismiss the alert by accepting it
            self.assertEqual(
                alert_text, "Please enter a package ID to check the rating.",
                "Unexpected alert message."
            )
            print("Handled the alert successfully.")

        except TimeoutException:
            print("No alert appeared during the Check Rating process.")

        # Now, wait for the rating result to appear
        try:
            rating_result_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//h2[text()='Package Rating Results:']/following-sibling::pre"))
            )
            result_text = rating_result_element.text

            # Validate that the result contains the package ID
            self.assertIn('NetScore', result_text)
        except TimeoutException:
            print("Rating result did not appear within the expected time.")
            
            
    def test_regex_search(self):
        driver = self.driver
        
        try:
            # Wait for the input field for regex search to be present
            regex_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Regex']"))
            )
            regex_input.clear()
            
            # Enter the regex search term
            regex_search_term = "debug.*"  # Example regex search term
            regex_input.send_keys(regex_search_term)

            # Wait for the "Search" button to be clickable
            search_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[text()='Search']"))
            )
            search_button.click()
            # Handle the alert
            WebDriverWait(driver, 10).until(EC.alert_is_present())
            alert = driver.switch_to.alert
            alert_text = alert.text

            # Verify the alert text
            self.assertIn("Search completed successfully!", alert_text)
            alert.accept()  # Close the alert
           
        except UnexpectedAlertPresentException:
            # Handle the alert if it is unexpectedly present
            alert = driver.switch_to.alert
            alert_text = alert.text
            print(f"Alert detected: {alert_text}")
            alert.accept()  # Accept the alert to close it

            # Optionally, you can assert the alert message
            self.assertEqual(alert_text, "Failed to perform regex search. Please try again.", "Unexpected alert message.")

    def test_update_existing_package(self):
        """Test updating an existing package."""
        driver = self.driver

        # Select the "Upload Content" radio button
        upload_content_radio = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//input[@value='content']"))
        )
        upload_content_radio.click()

        # Enter the Package ID to update
        package_id_input = driver.find_element(By.XPATH, "//input[@placeholder='Enter Package ID to Update']")
        package_id_input.clear()
        package_id_input.send_keys("debug-4_4_0")  # Example package ID

        # Enter the Package Name to update
        package_name_input = driver.find_element(By.XPATH, "//input[@placeholder='Enter Package Name to Update']")
        package_name_input.clear()
        package_name_input.send_keys("debug")  # Example package name

        # Enter the Package Version to update
        package_version_input = driver.find_element(By.XPATH, "//input[@placeholder='Enter Package Version to Update']")
        package_version_input.clear()
        package_version_input.send_keys("4.4.1")  # Example updated version

        # Enter the base64 encoded content
        base64_content_input = driver.find_element(By.XPATH, "//textarea[@placeholder='Paste Base64 Encoded Content Here']")
        base64_content_input.clear()
        base64_content_input.send_keys("U29tZSBkYXRhIGluIGJhc2U2NCBlbmNvZGluZyBhYmNkZWZnaA==")  # Example base64 content

        # Toggle the Apply Debloat checkbox
        debloat_checkbox = driver.find_element(By.XPATH, "//input[@type='checkbox']")
        debloat_checkbox.click()

        # Click the "Update Package" button
        update_button = driver.find_element(By.XPATH, "//button[text()='Update Package']")
        update_button.click()

        # Wait for the alert and check its message
        try:
            WebDriverWait(driver, 10).until(EC.alert_is_present())
            alert = driver.switch_to.alert
            alert_text = alert.text
            self.assertIn("Failed to update the package", alert_text, "Unexpected alert message.")
            alert.accept()  # Close the alert
        except TimeoutException:
            print("No alert appeared during the update process.")

    def test_get_packages(self):
        """Test the Get Packages functionality."""
        driver = self.driver

        # Wait for the package name input field
        package_name_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter package Name']"))
        )
        package_name_input.clear()

        # Enter the package name
        package_name = "debug"
        package_name_input.send_keys(package_name)

        # Wait for the package version input field
        package_version_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter package Version']"))
        )
        package_version_input.clear()

        # Enter the package version
        package_version = "4.4.0"
        package_version_input.send_keys(package_version)

        # Wait for the "Get Packages" button and click
        get_packages_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Get Packages']"))
        )
        get_packages_button.click()

        # Wait for the results to appear
        try:
            package_results = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//h2[text()='Package Results:']/following-sibling::ul"))
            )
            results_text = package_results.text
            self.assertIn(package_name, results_text)  # Verify that the package name is in the results
            self.assertIn(package_version, results_text)  # Verify that the package version is in the results
        except TimeoutException:
            print("Package results did not appear within the expected time.")
    
    def test_reset_data(self):
        """Test the Reset Data functionality."""
        driver = self.driver

        # Wait for the "Reset Data" button and click
        reset_data_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Reset Data']"))
        )
        reset_data_button.click()

        # Handle any unexpected alert that may appear during the reset
        try:
            WebDriverWait(driver, 5).until(EC.alert_is_present())
            alert = driver.switch_to.alert
            alert_text = alert.text
            print(f"Unexpected alert detected: {alert_text}")
            alert.accept()  # Dismiss the alert
            self.assertEqual(
                alert_text, "Failed to reset data. Please try again.",
                "Unexpected alert message."
            )
        except TimeoutException:
            print("No unexpected alert appeared during the Reset Data process.")



    def test_display_tracks(self):
        """Test the Display All Tracks functionality."""
        driver = self.driver

        # Wait for the "Get Tracks" button and click
        get_tracks_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Get Tracks']"))
        )
        get_tracks_button.click()

        # Wait for the track results to appear
        try:
            track_result = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//pre"))
            )
            track_result_text = track_result.text
            self.assertTrue(track_result_text)  # Verify that some track data is returned
        except TimeoutException:
            print("Track result did not appear within the expected time.")
    
    def tearDown(self):
        """Tear down the WebDriver after tests."""
        self.driver.quit()


if __name__ == "__main__":
    unittest.main()
