# Pathway Commons App(s)

[![DOI](https://zenodo.org/badge/104936681.svg)](https://zenodo.org/badge/latestdoi/104936681)


## Required software

- [Node.js](https://nodejs.org/en/) >=10.0.0 <11.0.0

## Running the App Locally

1. Install the project dependencies by typing:
    ```
    npm install
    ```

2.  Run the project using one of the defined package scripts:

    For development:
    ```
    npm run watch
    ```

    For a production build:
    ```
    npm run build-prod
    npm run start
    ```

## Configuration

The following environment variables can be used to configure the server (also docker image):

- `NODE_ENV`: the environment mode, either `production` or `development` (default)
- `PORT`: the port on which the server runs (default 3000)
- `PC_URL`: Pathway Commons homepage URL (default: 'http://www.pathwaycommons.org/'; cPath2 service should be there available at /pc2/ path)
- `NCBI_API_KEY`: NCBI E-Utilities API key ([read more](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/))
- `FACTOID_URL`: the Factoid app URL (default: 'http://unstable.factoid.baderlab.org/')
- `SBGN_IMG_SERVICE_BASE_URL`: URL for service that converts SBGN to an image (i.e. [Syblars](http://syblars.cs.bilkent.edu.tr/); default is `http://localhost:9090/`)
- `SBGN_IMG_PATH`: cli tool `snapshot` output folder for images (default: `public/img/pathways`)

## Run targets

- `npm start` : start the server
- `npm stop` : stop the server
- `npm run build` : build project
- `npm run build-prod` : build the project for production
- `npm run bundle-profile` : visualise the bundle dependencies
- `npm run clean` : clean the project
- `npm run watch` : watch mode (debug mode enabled, autorebuild, autoreload)
- `npm test` : run tests
- `npm run lint` : lint the project
- `npm run ci` : run the tests and lint at once


## Using Docker and Dockerfile

Build the image.

```
docker build -t pathwaycommons/app-ui .
```

Run the container:

```
docker run --detach --rm --publish 3000:3000 --env "NODE_ENV=production" --name "app-ui" pathwaycommons/app-ui
```

## Testing

All files `/test` will be run by [Mocha](https://mochajs.org/).  You can `npm test` to run all tests, or you
can run `npm run test ./test/path/to/test` to run specific tests.

[Chai](http://chaijs.com/) is included to make the tests easier to read and write.


## Scripts

### Command line tools

The `scripts/cli.js` file contains app-ui command line tools:
  - `source`: Download and extract a file to `downloads` folder
  - `snapshot`: Generate PNG images for pathways listed in a PC GMT-formatted file
    - Requires an instance of [Syblars](http://syblars.cs.bilkent.edu.tr/) accessible at a location defined by the configuration variable `SBGN_IMG_SERVICE_BASE_URL` (see `docker-compose.yml` service `syblars`)
    - Images will be placed in directory `SBGN_IMG_PATH` (default: `public/img/pathways`)

Usage: To generate a PNG of an SBGN representation for each pathway declared in the GMT file at `downloads/PathwayCommons12.All.hgnc.gmt`:

```sh
$ docker-compose up -d syblars
$ SERVER_FETCH_TIMEOUT="60000" node src/scripts/cli.js snapshot --file PathwayCommons12.All.hgnc.gmt
```
NB: The default timeout of fetch is normally quite brief (5 seconds).

In this way, images will be served via expressJS at `img/pathways/:id`, where `id` is the pathway URI with anything that is not a letter (a-z) or digit (0-9) is replaced with underscores (`_`).

## Developing a feature and making a pull request

Students who work on the repo should follow these instructions for each feature that they work on:

1. Initial preparation (only needed once)
    1. [Make a fork on Github](https://github.com/PathwayCommons/app-ui#fork-destination-box) (if you haven't already)
    under your personal account
    1. Check out the fork repo: `git clone https://github.com/myusername/app-ui.git`
    1. Change the directory to the project: `cd app-ui`
    1. Check out the `development` branch: `git checkout -b development origin/development`
    1. Add the `pc` remote: `git remote add pc https://github.com/PathwayCommons/app-ui.git`
1. Make sure you have the latest code on the main PathwayCommons repo:
    1. Using the console: `git fetch pc`
    1. Or using GitUp: `Remotes > Fetch All Branches`, `Remotes > Fetch All Tags`
1. Make sure your `development` branch is up-to-date:
    1. Using the console: `git checkout development && git merge pc/development`
    1. Using GitUp:
        1. Right-click the commit that `pc/development` points to
        1. Select `Merge into Current Branch`
  1. Make a feature branch for the new feature or change you are working on.  Make sure to give your branch a clear, meaningful name.
      1. Using the console: `git checkout -b name-of-feature`
      1. Using GitUp: Right click the `HEAD` commit (which should be the top commit of your local `development` branch),
      then select `Create Branch...`
1. Make commits as you're working on your feature:
    1. Using the console: `git commit -am "My descriptive commit message"`
    1. Using GitUp: Use the `Select View` tab (`View > Commit`)
        1. Stage the files
        1. Add a descriptive commit message
        1. Press the `Commit` button
1. Periodically (at least once just before making a pull request) make sure your feature branch takes into account
the latest changes other people have made:
    1. Make sure your `development` branch is up-to-date:
        1. Using the console: `git checkout development && git merge pc/development`
        1. Using GitUp:
            1. Right-click the commit that `pc/development` points to
            1. Select `Merge into Current Branch
    1. Make sure your feature branch is up-to-date:
        1. Using the console: `git checkout name-of-feature`, `git merge development`
        1. Using GitUp:
            1. Make sure your `HEAD` is the newest commit of your feature branch: Right-click the latest commit
            on `name-of-feature` branch and select `Checkout "name-of-feature" Branch`
            1. Right-click the latest commit of the `development` branch and select `Merge into Current Branch`
1. Push your commits to GitHub:
    1. Note: You can push as often as you'd like so that your code is backed up on GitHub.  You *must* push everything
    before you make a pull request.
    1. Using the console: `git push`
    1. Using GitUp: `Remotes > Push Current Branch`
1. When your feature is done and ready to be reviewed, make a pull request:
    1. Go to your fork on GitHub, e.g. https://github.com/myusername/app-ui
    1. Select your feature branch
    1. Click the `New pull request` button
    1. Give your pull request a clear title and a meaningful description

## Publishing a release

1. Create a release branch off of master, e.g. `release/1.2.3`
1. Merge the latest dev into the release branch.
1. Make sure the tests are passing: `npm test`
1. Make sure the linting is passing: `npm run lint`
1. Bump the version number with `npm version`, in accordance with [semver](http://semver.org/).  The `version` command
in `npm` updates both `package.json` and git tags, but note that it uses a `v` prefix on the tags (e.g. `v1.2.3`).
  1. For a bug fix / patch release, run `npm version patch`.
  1. For a new feature release, run `npm version minor`.
  1. For a breaking API change, run `npm version major.`
  1. For a specific version number (e.g. 1.2.3), run `npm version 1.2.3`.
1. Make a PR for the release branch onto master.
1. Push the release: `git push origin --tags`
1. Publish a [release](https://github.com/PathwayCommons/app-ui/releases) for Zenodo.
