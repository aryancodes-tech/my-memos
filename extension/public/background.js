// Background service worker. Keeps the extension alive for future features
// (sync, scheduled revisions, AI calls). Currently a no-op listener.
chrome.runtime.onInstalled.addListener(() => {
  console.log("KnowledgeOS installed");
});

chrome.action.onClicked.addListener(async () => {
  await chrome.tabs.create({ url: "chrome://newtab" });
});
