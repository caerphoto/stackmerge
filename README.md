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

4. Open `http://localhost:3000/` in your browser.

## Not done yet

For now the app just blindly stacks images on top of each other using the first
image's size as the base, and sets the opacity of each image to (1/n) where n is
the number of images. Obviously this isn't final behaviour :)

There's also not much in the way of UI: no way to re-order images, the
visibility toggling checkboxes don't actually do anything, you can't save your
work, etc.
