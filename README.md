# Stack Merge

A web app for merging images, keeping only the pixels they have in common, as
explained in [this Luminous Landscape article](https://luminous-landscape.com/making-people-and-other-things-go-away/).

## Install and run

1. Clone this repo:

        git clone https://github.com/caerphoto/stackmerge.git

2. Install dependencies:

        cd stackmerge
        npm install

3. Start the server:

        node server.js

4. Open <http://localhost:3000/> in your browser.

## Not done yet

For now the app just blindly stacks images on top of each other using the first
image's size as the base, and outputs the median of each pixel of each image. If
the images aren't perfectly aligned, this will look weird. I need to add
(possibly sub-pixel) alignment controls.
