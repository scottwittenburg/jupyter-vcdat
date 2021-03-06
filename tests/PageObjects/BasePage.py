import time

from abc import abstractmethod
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains


class BasePage(object):
    """ All page objects inherit from this """

    _wait_timeout = 3
    _delay = 2

    def __init__(self, driver, server):
        self.driver = driver
        if server:
            self.load_page(server)
        self._validate_page()

    @abstractmethod
    def _validate_page(self):
        return

    def find_element_and_click(self, xpath, descr):
        try:
            elem = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.XPATH, xpath)))
            print("FOUND {d}, clicking it".format(d=descr))
            elem.click()
            time.sleep(self._delay)
        except TimeoutException as e:
            print("TimeoutException...not finding {d} to be clickable".format(d=descr))
            raise e

    def find_element(self, xpath, descr):
        try:
            element = self.driver.find_element_by_xpath(xpath)
            print("FOUND {d}".format(d=descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding {d}".format(d=descr))
            raise e

        return element

    def action_chains_find_element_and_click(self, xpath, descr):
        try:
            element = self.driver.find_element_by_xpath(xpath)
            action_chains = ActionChains(self.driver)
            action_chains.move_to_element(element)
            action_chains.click(element)
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding {d}".format(d=descr))
            raise e

    def load_page(self, server, expected_element=(By.TAG_NAME, 'html'),
                  timeout=_wait_timeout):
        url = server
        print("...load_page, url: {u}".format(u=url))
        try:
            self.driver.get(url)
        except TimeoutException:
            assert(False), "page not found or timeout for {0}".format(url)

        element = EC.presence_of_element_located(expected_element)
        try:
            WebDriverWait(self.driver, timeout).until(element)
        except TimeoutException:
            assert(False), "page not found or timeout  for {0}".format(url)
        time.sleep(self._delay)


class InvalidPageException(Exception):
    """ Throw this exception when we do not find the correct page """
    pass
