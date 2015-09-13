/*global postMessage, onmessage:true */
/* Quicksort implementation from
* http://blog.mgechev.com/2012/11/24/javascript-sorting-performance-quicksort-v8/
*/
var allPixels = [];

var abs = Math.abs;
var floor = Math.floor;
var rowSize;

function edgeIntensityFast(pixelData, pixelIndex) {
    var thisPixel = pixelData[pixelIndex];
    //var sum = 0;

    // Starting from (-1, -1) going across then down to (1, 1), skipping the
    // current pixel. Corner pixels are divided by sqrt(2) to account for their
    // distance to the current pixel.
    //sum += pixelData[pixelIndex - rowSize - 4];
    //sum += pixelData[pixelIndex - rowSize];
    //sum += pixelData[pixelIndex - rowSize + 4];

    //sum += pixelData[pixelIndex - 4];
    //sum += pixelData[pixelIndex + 4];

    //sum += pixelData[pixelIndex + rowSize - 4];
    //sum += pixelData[pixelIndex + rowSize];
    //sum += pixelData[pixelIndex + rowSize + 4];

    //return abs(thisPixel - floor(sum / 4));
    return abs(thisPixel - pixelData[pixelIndex - 4]);
}

function edgeIntensityNice(pixelData, pixelIndex) {
    // Starting from (-1, -1) going across then down to (1, 1), skipping the
    // current pixel. Corner pixels are divided by sqrt(2) to account for their
    // distance to the current pixel.
    var thisPixel = pixelData[pixelIndex];
    var sum = pixelData[pixelIndex - rowSize - 4];
    sum += pixelData[pixelIndex - rowSize];
    sum += pixelData[pixelIndex - rowSize + 4];

    sum += pixelData[pixelIndex - 4];
    sum += pixelData[pixelIndex + 4];

    sum += pixelData[pixelIndex + rowSize - 4];
    sum += pixelData[pixelIndex + rowSize];
    sum += pixelData[pixelIndex + rowSize + 4];

    return abs(thisPixel - floor(sum / 8));
}

function indexOfMax(array, length) {
    var max = array[0];
    var maxIndex = 0;
    var i;
    for (i = 1; i < length; i += 1) {
        if (array[i] > max) {
            max = array[i];
            maxIndex = i;
        }
    }

    return maxIndex;
}

function mergeImages(fnEdgeIntensity) {
    var combined = new Uint8ClampedArray(allPixels[0].length);

    var b;

    var imageIndex;
    var numImages = allPixels.length;
    var stackPixels = new Uint8ClampedArray(numImages);

    // By 50 because each instance of this worker only handles half the image
    // data.
    var onePercent = floor(combined.length / 50);

    b = combined.length;
    while (b--) {
        if ((b + 1) % 4 === 0) {
            // Alpha channel is always 255
            combined[b] = 255;
        } else {
            imageIndex = numImages;
            while (imageIndex--) {
                stackPixels[imageIndex] = fnEdgeIntensity(allPixels[imageIndex], b);
            }

            imageIndex = indexOfMax(stackPixels, numImages);
            combined[b] = allPixels[imageIndex][b];
        }

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }

    allPixels = [];
    postMessage(combined.buffer, [combined.buffer]);
    close();
}

onmessage = function (message) {
    if (message.data === 'start nice') {
        mergeImages(edgeIntensityNice);
    } else if (message.data === 'start fast') {
        mergeImages(edgeIntensityFast);
    } else if (message.data.byteLength) {
        allPixels.push(new Uint8ClampedArray(message.data));
    } else {
        rowSize = message.data * 4;
    }
};
