// Redirect real visitors from the app's default published base44.app
// subdomain to the custom domain (www.dialbrowser.com) before the app
// mounts, so the base44.app address never stays in the browser bar.
// This ONLY fires on the exact default published subdomain — the builder
// preview and commit-preview hosts use different hostnames and load normally.
(function () {
  var PRIMARY = "www.dialbrowser.com";
  var DEFAULT_SUBDOMAIN = "dialbrowser.base44.app";
  var host = window.location.hostname;
  if (host !== PRIMARY && host === DEFAULT_SUBDOMAIN) {
    var target = "https://" + PRIMARY + window.location.pathname + window.location.search + window.location.hash;
    window.location.replace(target);
  }
})();