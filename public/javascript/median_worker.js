/*global postMessage, onmessage:true, ImageData */
/* Quicksort implementation from
* http://blog.mgechev.com/2012/11/24/javascript-sorting-performance-quicksort-v8/
*/
var allPixels = [];
var width, height;

function swap(array, i, j) {
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    return array;
}

function partition(array, left, right) {
    var cmp = array[right - 1],
        minEnd = left,
        maxEnd;
    for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) {
        if (array[maxEnd] <= cmp) {
            swap(array, maxEnd, minEnd);
            minEnd += 1;
        }
    }
    swap(array, minEnd, right - 1);
    return minEnd;
}

function quickSort(array, left, right) {
    if (left < right) {
        var p = partition(array, left, right);
        quickSort(array, left, p);
        quickSort(array, p + 1, right);
    }
    return array;
}

function mergeImages() {
    var combined = new Uint32Array(allPixels[0].length);

    var pixel;

    var imageIndex;
    var numImages = allPixels.length;
    var stackPixels = new Uint32Array(numImages);
    var medianIndex = Math.floor(numImages / 2);

    var onePercent = Math.floor(combined.length / 100);

    pixel = combined.length;
    while (pixel--) {
        imageIndex = numImages;
        while (imageIndex--) {
            stackPixels[imageIndex] = allPixels[imageIndex][pixel];
        }
        combined[pixel] = quickSort(stackPixels, 0, numImages)[medianIndex];

        if (pixel % onePercent === 0) {
            postMessage(100 - pixel / onePercent);
        }
    }

    allPixels = [];
    postMessage(new ImageData(new Uint8ClampedArray(combined.buffer), width, height));
}

onmessage = function (message) {
    if (message.data === 'start') {
        mergeImages();
    } else if (message.data.byteLength) {
        allPixels.push(new Uint32Array(message.data));
    } else {
        width = message.data.width;
        height = message.data.height;
    }
};
