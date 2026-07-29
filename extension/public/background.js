// Background service worker. Registers uninstall feedback URL and opens New Tab from the action icon.
import { EXTENSION_UNINSTALL_PAGE_URL } from "../src/lib/constants";

function registerUninstallFeedbackUrl() {
  void chrome.runtime.setUninstallURL(EXTENSION_UNINSTALL_PAGE_URL);
}

chrome.runtime.onInstalled.addListener(() => {
  registerUninstallFeedbackUrl();
  console.log("MyMemos installed");
});

registerUninstallFeedbackUrl();

chrome.action.onClicked.addListener(async () => {
  await chrome.tabs.create({ url: "chrome://newtab" });
});
