# Stack Merge

A web app for merging images, keeping only the pixels they have in common, as
explained in [this Luminous Landscape
article](https://luminous-landscape.com/making-people-and-other-things-go-away/).
That page also has some demo image sets you can download, but I recommend
resizing them down to something web-appropriate (e.g. 1000 pixels across) first,
as loading ten 24 megapixel images into a browser is rather slow. It does work
though, eventually.

Demo available at <http://stackmerge.andyf.me/>

## Install and run

1. Clone this repo:

        git clone https://github.com/caerphoto/stackmerge.git

2. Install dependencies:

        cd stackmerge
        npm install

3. Start the server:

        npm start

4. Open <http://localhost:8377/> in your browser.

## Not done yet

For now the app just blindly stacks images on top of each other using the first
image's size as the base, and outputs the median of all the source pixels at
easch location in image. If the images aren't perfectly aligned, the result will
look slightly mushy, like it's had overly zealous noise reduction applied. I
need to add (possibly sub-pixel) alignment controls to alleviate this, but
that's... non-trivial.
