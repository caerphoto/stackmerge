/*global postMessage, onmessage:true, ImageData */
/* Quicksort implementation from
* http://blog.mgechev.com/2012/11/24/javascript-sorting-performance-quicksort-v8/
*/
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

function qs(array) {
    return quickSort(array, 0, array.length);
}

function mergeImages(allData) {
    var allPixels = allData.map(function (data) {
        return data.data;
    });
    var combined = new Uint8ClampedArray(allPixels[0].length);

    var pixelByte;
    var numBytes = combined.length;

    var imageIndex;
    var numImages = allData.length;
    var r = new Uint8ClampedArray(numImages);
    var g = new Uint8ClampedArray(numImages);
    var b = new Uint8ClampedArray(numImages);
    var medianIndex = Math.floor(numImages / 2);

    for (pixelByte = 0; pixelByte < numBytes; pixelByte += 4) {
        for (imageIndex = 0; imageIndex < numImages; imageIndex += 1) {
            r[imageIndex] = allPixels[imageIndex][pixelByte];
            g[imageIndex] = allPixels[imageIndex][pixelByte + 1];
            b[imageIndex] = allPixels[imageIndex][pixelByte + 2];
        }

        combined[pixelByte] = qs(r)[medianIndex];
        combined[pixelByte + 1] = qs(g)[medianIndex];
        combined[pixelByte + 2] = qs(b)[medianIndex];
        combined[pixelByte + 3] = 255;
    }

    postMessage(new ImageData(
        combined,
        allData[0].width,
        allData[0].height
    ));
}

onmessage = function (message) {
    mergeImages(message.data);
};
