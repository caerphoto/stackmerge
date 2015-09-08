/*global postMessage, onmessage:true, ImageData */
var allPixels = [];
var width, height;

/* Fast median algorithm adapted from C# example at
 * http://www.i-programmer.info/babbages-bag/505-quick-median.html?start=1
 */
function split(array, splitVal, left, right) {
    var temp;
    // do the left and right scan until the pointers cross
    do {
        // scan from the left then scan from the right
        while (array[left] < splitVal) {
            left += 1;
        }
        while (splitVal < array[right]) {
            right -= 1;
        }
        // now swap values if they are in the wrong part:
        if (left <= right) {
            temp = array[left];
            array[left] = array[right];
            array[right] = temp;

            left += 1;
            right -= 1;
        }
        //and continue the scan until the pointers cross:
    } while (left <= right);

    return [left, right];
}

function fastMedian(array, length, mid) {
    var left = 0;
    var right = length - 1;
    var endpoints;
    var midVal;
    while (left < right) {
        midVal = array[mid];
        endpoints = split(array, midVal, left, right);
        if (endpoints[1] < mid) {
            left = endpoints[0];
        }
        if (mid < endpoints[0]){
            right = endpoints[1];
        }
    }

    return array[mid];
}

function mergeImages() {
    var combined = new Uint8ClampedArray(allPixels[0].length);

    var floor = Math.floor; // Slight optimisation - avoids property lookup

    var b;

    var imageIndex;
    var numImages = allPixels.length;
    var stackPixels = new Uint8ClampedArray(numImages);
    var medianIndex = floor(numImages / 2);

    var onePercent = floor(combined.length / 100);

    b = combined.length;
    while (b--) {
        if ((b + 1) % 4 === 0) {
            // Alpha channel is always 255
            combined[b] = 255;
        } else {
            imageIndex = numImages;
            while (imageIndex--) {
                stackPixels[imageIndex] = allPixels[imageIndex][b];
            }

            combined[b] = fastMedian(stackPixels, numImages, medianIndex);
        }

        if (b % onePercent === 0) {
            postMessage(100 - b / onePercent);
        }
    }

    allPixels = [];
    postMessage(new ImageData(combined, width, height));
}

onmessage = function (message) {
    if (message.data === 'start') {
        mergeImages();
    } else if (message.data.byteLength) {
        allPixels.push(new Uint8ClampedArray(message.data));
    } else {
        width = message.data.width;
        height = message.data.height;
    }
};
