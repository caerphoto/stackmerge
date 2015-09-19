# Stack Merge

A web app for merging images in one of two ways:

1. Keeping only the pixels they have in common, as explained in [this Luminous
   Landscape article](https://luminous-landscape.com/making-people-and-other-things-go-away/).

    That page also has some demo image sets you can download, but I recommend
    resizing them down to something web-appropriate (e.g. 1000 pixels across) first,
    as loading ten 24 megapixel images into a browser is rather slow. It does work
    though, eventually.

2. Using the pixels with the highest contrast, also known as [focus stacking](https://en.wikipedia.org/wiki/Focus_stacking)

Live application running at <http://stackmerge.andyf.me/>

## Install and run

1. Clone this repo:

        git clone https://github.com/caerphoto/stackmerge.git

2. Install dependencies:

        cd stackmerge
        npm install

3. Start the server:

        npm start

4. Open <http://localhost:8377/> in your browser.

## Running in production

The app comes with a Gruntfile that will concatenate and minify the JavaScript,
and save it to a timestamp-named file which the application detects on startup
in production mode.

Just run `grunt` in the project directory; the default task will do the
necessary.

## Not done yet

For now the app just blindly stacks images on top of each other using the first
image's size as the base.  If the images aren't perfectly aligned, the result
will look slightly mushy or have weird edge artifacts.

I'd like to add some kind of alignment control or algorithm to alleviate this,
but it's... non-trivial.
