import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, '..', 'PageObjects'))

from JupyterUtils import JupyterUtils
from VcdatLeftSideBar import VcdatLeftSideBar
from FileBrowser import FileBrowser
from MainPage import MainPage
from NoteBookPage import NoteBookPage

import time
import unittest
import tempfile

from selenium.common.exceptions import NoSuchElementException
from selenium import webdriver
from selenium.webdriver import DesiredCapabilities
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.firefox_profile import FirefoxProfile
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from pyvirtualdisplay import Display


class BaseTestCase(unittest.TestCase):

    _delay = 1
    _wait_timeout = 3
    # _test_notebook_file = 'test_jpvcdat.ipynb'

    def setUp(self):
        self._download_dir = tempfile.mkdtemp()
        browser = os.getenv("BROWSER_TYPE", 'chrome')
        mode = os.getenv("BROWSER_MODE", '--headless')
        print("...browser: {b}".format(b=browser))
        print("...mode: {m}".format(m=mode))

        if mode == "--headless" and os.getenv("CIRCLECI"):
            print("...starting display since we are running in headless mode")
            display = Display(visible=0, size=(800, 600))
            display.start()

        if browser == 'chrome':
            self.setup_for_chrome(mode)
        elif browser == 'firefox':
            self.setup_for_firefox(mode)

        self.driver.implicitly_wait(self._wait_timeout)
        time.sleep(self._delay)

        utils = JupyterUtils()
        self.server = utils.get_server()
        self.main_page = MainPage(self.driver, self.server)
        self._test_notebook_file = "{t}.ipynb".format(t=self._testMethodName)
        self.notebook_page = NoteBookPage(self.driver, None)
        self.notebook_page.rename_notebook(self._test_notebook_file)

    def tearDown(self):
        print("xxx xxx BaseTestCase.tearDown() xxx xxx")
        self.main_page.shutdown_kernel()
        self.notebook_page.close_current_notebook()
        self.driver.quit()
        os.remove(self._test_notebook_file)

    def setup_for_chrome(self, mode):
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument(mode)
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("window-size=1200x600")
        self.driver = webdriver.Chrome(executable_path="/usr/local/bin/chromedriver",
                                       chrome_options=chrome_options,
                                       service_args=['--verbose', '--log-path=/tmp/chromedriver.log'])

    def setup_for_firefox(self, mode):
        firefox_profile = FirefoxProfile()
        firefox_profile.set_preference('extensions.logging.enabled', False)
        firefox_profile.set_preference('network.dns.disableIPv6', False)
        firefox_profile.set_preference('browser.download.dir', self._download_dir)
        firefox_profile.set_preference('browser.download.folderList', 2)
        firefox_profile.set_preference('browser.download.useDownloadDir', True)
        firefox_profile.set_preference('browser.download.panel.shown', False)
        firefox_profile.set_preference('browser.download.manager.showWhenStarting', False)
        firefox_profile.set_preference('browser.download.manager.showAlertOnComplete', False)
        firefox_capabilities = DesiredCapabilities().FIREFOX
        firefox_capabilities['marionette'] = True
        firefox_capabilities['moz:firefoxOptions'] = {'args': ['--headless']}
        options = Options()
        options.binary_location = "/usr/local/bin/geckodriver"
        firefox_binary = FirefoxBinary("/usr/local/bin/firefox")
        self.driver = webdriver.Firefox(firefox_profile=firefox_profile,
                                        firefox_binary=firefox_binary,
                                        executable_path="/usr/local/bin/geckodriver",
                                        options=options,
                                        capabilities=firefox_capabilities)

    #
    # notebook utils
    #

    def close_notebook_if_any(self):
        try:
            note_book = NoteBookPage(self.driver)
            note_book.close()
            time.sleep(self._delay)
        except NoSuchElementException:
            print("No notebook opened")
            pass

    def new_notebook(self, notebook_title):
        self.main_page.new_notebook()
        self.main_page.select_kernel()
        self.main_page.rename_notebook(notebook_title)

    def close_current_notebook(self):
        self.main_page.close_current_notebook()

    #
    # Load a data file
    #

    def load_data_file(self, filename):
        left_side_bar = VcdatLeftSideBar(self.driver, None)
        left_side_bar.click_on_jp_vcdat_icon()
        time.sleep(self._delay)
        left_side_bar.click_on_load_variables()

        file_browser = FileBrowser(self.driver, None)
        file_browser.double_click_on_a_file(filename)
        # self.main_page.select_kernel()
        time.sleep(self._delay)

        return left_side_bar

    #
    # kernel utils
    #
    def select_kernel(self):
        self.main_page.select_kernel()
