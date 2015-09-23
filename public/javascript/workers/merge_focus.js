/*global postMessage, onmessage:true */
var sourceImages = [];

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

function mergeImages() {
    var combined = new Uint8Array(sourceImages[0].length);
    var dataSize = sourceImages[0].length;

    var b;

    var imageIndex;
    var numImages = sourceImages.length;
    var stackPixels = new Uint8Array(numImages);

    var onePercent = Math.round(dataSize / 100);


    for (b = 0; b !== dataSize; b += 4) {
        for (imageIndex = 0; imageIndex !== numImages; imageIndex += 1) {
            stackPixels[imageIndex] = sourceImages[imageIndex][b + 3];
        }

        imageIndex = indexOfMax(stackPixels, numImages);
        combined[b] = sourceImages[imageIndex][b];
        combined[b + 1] = sourceImages[imageIndex][b + 1];
        combined[b + 2] = sourceImages[imageIndex][b + 2];
        combined[b + 3] = 255;

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }

    postMessage(combined.buffer, [combined.buffer]);
    close();
}

onmessage = function (message) {
    var data = message.data;
    if (data === 'start') {
        mergeImages();
    } else if (data.byteLength) {
        sourceImages.push(new Uint8Array(data));
    }
};
