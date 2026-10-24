# SnapScout

**Live app:** https://harshitavennam.github.io/snapscout/
**Repo:** https://github.com/harshitavennam/snapscout

SnapScout is an image-search app: type a topic, press Search, and a grid of pictures from Wikimedia Commons appears. Each card shows the image, its title and the author, and links to the full image page. I put the search in a sticky top bar so it stays reachable while scrolling through results. I added quick-pick chips (Nature, Cities, Animals, Food) so people can start a search in one click. The app handles every state: a spinner with skeleton cards while loading, a friendly message when nothing is found, and an error message if the network fails. Built with plain HTML, CSS and JavaScript, no frameworks.