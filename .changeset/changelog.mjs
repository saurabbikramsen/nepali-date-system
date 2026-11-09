// Writes each changeset into CHANGELOG.md as one bullet, in the words of its summary. The
// default also prints the commit hash, which means nothing to someone reading the changelog
// on npm or GitHub to decide whether to upgrade.
export default {
  getReleaseLine(changeset) {
    const [first, ...rest] = changeset.summary
      .trim()
      .split("\n")
      .map((line) => line.trimEnd());
    return [`- ${first}`, ...rest.map((line) => (line ? `  ${line}` : ""))].join("\n");
  },
  // The package has no dependencies, so there are never dependency updates to list.
  getDependencyReleaseLine() {
    return "";
  },
};
