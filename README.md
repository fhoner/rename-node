# Rename Node

This script allows to rename images. GPS location, taken from EXIF metadata, will be used to reverse geocode to its
address data. Define a custom naming schema for your photos.

## Usage

### Prerequisites

Install nvm (homebrew)

```shell
brew install nvm
```

Add nvm to your shell profile (zsh):

```
export NVM_DIR=~/.nvm
source $(brew --prefix nvm)/nvm.sh
```

Install node

```shell
nvm install 22.12.0
```

### Installation

Download the latest release and install npm dependencies:

```shell
curl -sL $(curl -s https://api.github.com/repos/fhoner/rename-node/releases/latest | grep "tarball_url" | cut -d '"' -f 4) | tar xz && mv fhoner-rename-node-* rename-node-release
cd rename-node-release
npm i
```

### Rename files

Example:

```
node "/path/to/rename-node-release/index.js" \                                                                          ✔  11:44:03 
    --apikey="<your-api-key>" \
    --directory="<your-photos-directory>" \
    --format="<your-naming-schema>"
```

Example with values:

```
node "/Users/felix.honer/Development/privat/rename-node-release/index.js" \                                                                          ✔  11:44:03 
    --apikey="xxxxxx" \
    --directory="/Users/felix.honer/Downloads/photos" \
    --format="%timestamp% - My fantastic tour - %formatted%"
```

### Available format variables

#### Fixed

| Name      | Value                                                                                                                                                                                                |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Timestamp | The timestamp when the photo was taken<br/>Taken out of EXIF metadata, therefore can be empty<br/>Format can be customized with anther CLI argument `datetimeFormat` (default `yyyy-MM-dd HH-mm-ss`) |

#### Dynamic

All values from geoapify response http can be used. See following example for reference:

```
{
  "results": [
    {
      ...
      "country": "Italien",
      "country_code": "it",
      "state": "Lombardei",
      "county": "Sondrio",
      "city": "Luwin",
      "municipality": "Comunità montana Alta Valtellina",
      "postcode": "23041",
      "iso3166_2": "IT-25",
      "iso3166_2_sublevel": "IT-SO",
      "lon": 10.191795226416083,
      "lat": 46.62376303527771,
      "distance": 6.492119914140896,
      "result_type": "postcode",
      "county_code": "SO",
      "formatted": "23041 Luwin SO, Italien",
      "address_line1": "23041 Luwin SO",
      "address_line2": "Italien",
      ...
    }
  ],
  ...
}
```

Available variables are `%country%`, `%country_code%`, `%city%` etc.
Note that the response may vary depending on the available data in openstreetmaps, e.g. city/village could be missing.
