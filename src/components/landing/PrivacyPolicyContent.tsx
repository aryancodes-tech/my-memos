import { GITHUB_REPO_URL, PRIVACY_POLICY_LAST_UPDATED, PRODUCT_NAME } from "@/lib/constants";

/** Privacy policy body for the marketing site (Chrome Web Store / visitors). */
export function PrivacyPolicyContent() {
  return (
    <article className="landing-legal-prose">
      <p className="landing-legal-updated">Last updated: {PRIVACY_POLICY_LAST_UPDATED}</p>

      <p>
        This Privacy Policy describes how <strong>{PRODUCT_NAME}</strong> (“we”, “us”) handles
        information when you use the {PRODUCT_NAME} browser extension, the optional live demo at{" "}
        <code>/demo/</code>, and this marketing website.
      </p>

      <h2>Summary</h2>
      <p>
        {PRODUCT_NAME} is <strong>local-first</strong>. Your notes, folders, images, and voice notes
        are stored on your device. We do not require an account, and we do not operate a sync server
        for your content. Nothing you write in the extension is uploaded to a {PRODUCT_NAME} backend
        for storage.
      </p>

      <h2>Browser extension</h2>
      <h3>What we store on your device</h3>
      <ul>
        <li>
          <strong>Pages and folders</strong> - document content (block JSON) in the browser’s
          IndexedDB database for this extension.
        </li>
        <li>
          <strong>Images and voice / audio attachments</strong> - binary files in the Origin Private
          File System (OPFS) on your device. Paths and metadata are referenced from your notes.
        </li>
        <li>
          <strong>Settings</strong> - preferences such as theme, last opened view, custom themes,
          collapsed folders, and product-tour status in <code>chrome.storage.local</code> (or the
          extension’s equivalent local settings store).
        </li>
      </ul>
      <p>
        This data stays in your browser profile. Uninstalling the extension or clearing site /
        extension data may permanently delete it. We cannot recover content we never received.
      </p>

      <h3>Permissions</h3>
      <p>
        The extension requests only the permissions needed to replace your New Tab and save settings
        (for example, <code>storage</code>). It does not request access to your browsing history or
        to read arbitrary websites for advertising.
      </p>

      <h3>Network activity</h3>
      <p>
        Core note-taking does not send your pages or attachments to our servers. Some optional
        editor features (such as fetching a pasted image URL) may contact a third-party host you
        chose; that request goes from your browser to that host, not through a {PRODUCT_NAME}{" "}
        content API.
      </p>

      <h2>
        Live demo (<code>/demo/</code>)
      </h2>
      <p>
        The web demo runs the same UI in your browser. Pages use IndexedDB and settings use{" "}
        <code>localStorage</code> for that website origin. Demo data is separate from the installed
        extension and does not sync with it. Clearing site data for the demo origin removes demo
        notes.
      </p>

      <h2>Marketing website</h2>
      <p>
        This site may use standard hosting and delivery infrastructure (for example CDN-hosted media
        such as the launch video). The site may also load privacy-respecting web analytics provided
        by the host (for example Vercel Analytics) to understand aggregate traffic. Analytics on the
        marketing site are separate from extension note storage and do not include the contents of
        your notes.
      </p>
      <p>
        Server logs typical of web hosting (such as IP address, user agent, and requested URL) may
        be processed by the host briefly for security and reliability.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the product evolves. The “Last updated” date at the top will
        change when we do. Continued use after an update means you accept the revised policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy: open an issue or security advisory on the{" "}
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
          {PRODUCT_NAME} GitHub repository
        </a>
        . Please report security vulnerabilities privately as described in <code>SECURITY.md</code>{" "}
        rather than in a public issue.
      </p>
    </article>
  );
}
