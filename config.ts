// Configuration for the PR filter app

export const config = {
  // GitHub repository to fetch PRs from
  repo: {
    owner: "expo",
    name: "expo",
  },

  // List of GitHub usernames to exclude from the PR list
  // Add or remove usernames as needed
  excludedAuthors: [
    "jonsamp",
    "HubertBer",
    "douglowder",
    "vonovak",
    "Kudo",
    "tsapeta",
    "kitten",
    "intergalacticspacehighway",
    "Wenszel",
    "hassankhan",
    "jakex7",
    "behenate",
    "aleqsio",
    "alanjhughes",
    "Ubax",
    "gabrieldonadel",
    "amandeepmittal",
    "lukmccall",
    "chrfalch",
    "kadikraman",
    "sjchmiela",
    "byCedric",
    "EvanBacon",
    "dependabot[bot]",
    "krystofwoldrich",
    "hirbod",
    "brentvatne",
    "quinlanj",
    //
    "kosmydel",
    "barthap",
  ],

  // Number of PRs to fetch per page (max 100)
  perPage: 100,

  // Maximum number of pages to fetch (set to 5 to fetch ~500 PRs)
  maxPages: 5,
};
