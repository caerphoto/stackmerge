/*global postMessage, onmessage:true */
/* Quicksort implementation from
* http://blog.mgechev.com/2012/11/24/javascript-sorting-performance-quicksort-v8/
*/
var sourceImages = [];

var abs = Math.abs;

var imageWidth = 0;
var offsets = [];
var matrixGaussian = [
    1, 2, 1,
    2, 4, 2,
    1, 2, 1
];
var matrixLaplacian = [
    -1, -1, -1,
    -1,  8, -1,
    -1, -1, -1
];
var matrixSize = matrixGaussian.length;

function pixelByApplyingMatrix(matrix, pixelData, pixelIndex) {
    var sum = 0;
    var pixel;
    for (pixel = 0; pixel !== matrixSize; pixel += 1) {
        sum += pixelData[pixelIndex + offsets[pixel]] * matrix[pixel];
    }

    return sum;
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

function calculateOffsets(channels) {
    // Pre-calculate pixel data offsets for surrounding pixels, for use in
    // matrix functions.
    var x, y;
    var rowSize = imageWidth * channels;
    offsets = [];
    for (y = -1; y <= 1; y += 1) {
        for (x = -1; x <= 1; x += 1) {
            offsets.push(rowSize * y + x * channels);
        }
    }
}

function mergeImages() {
    var combined = new Uint8Array(sourceImages[0].length);
    var dataSize = sourceImages[0].length / 4;

    var blurredImages = [];
    var focusMasks = [];
    var blurredFocusMasks = [];

    var b;

    var imageIndex;
    var numImages = sourceImages.length;
    var stackPixels = new Uint8Array(numImages);

    // By 25 because each instance of this worker only handles half the image
    // data, and we loop through the pixel data twice.
    var onePercent = Math.floor(dataSize / 16.6666);

    // Set up buffers for blurred image data.
    for (imageIndex = 0; imageIndex < numImages; imageIndex += 1) {
        blurredImages[imageIndex] = new Uint8Array(dataSize);
        focusMasks[imageIndex] = new Uint8Array(dataSize);
        blurredFocusMasks[imageIndex] = new Uint8Array(dataSize);
    }

    // First pass creates a gaussian-blurred copy of the green channel of each
    // source image.
    calculateOffsets(4);
    for (b = 0; b !== dataSize; b += 1) {
        for (imageIndex = 0; imageIndex !== numImages; imageIndex += 1) {
            blurredImages[imageIndex][b] = pixelByApplyingMatrix(
                matrixGaussian,
                sourceImages[imageIndex],
                (b + 1) * 4
            ) / 16;
        }

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }

    // Second pass applies Laplacian edge detection on the blurred images to
    // create a focus mask for each one.
    calculateOffsets(1);
    for (b = 0; b !== dataSize; b += 1) {
        for (imageIndex = 0; imageIndex !== numImages; imageIndex += 1) {
            focusMasks[imageIndex][b] = abs(pixelByApplyingMatrix(
                matrixLaplacian,
                blurredImages[imageIndex],
                b
            ));
        }

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }

    // Third finds the pixel in a gaussian blurred version of each focus mask
    // image with the highest value. The index of this image is used as the
    // index into the stack of source images.
    for (b = 0; b !== dataSize; b += 1) {
        for (imageIndex = 0; imageIndex !== numImages; imageIndex += 1) {
            stackPixels[imageIndex] = pixelByApplyingMatrix(
                matrixGaussian,
                focusMasks[imageIndex],
                b
            ) / 16;
        }
        imageIndex = indexOfMax(stackPixels, numImages);
        combined[b * 4] = sourceImages[imageIndex][b * 4];
        combined[b * 4 + 1] = sourceImages[imageIndex][b * 4 + 1];
        combined[b * 4 + 2] = sourceImages[imageIndex][b * 4 + 2];
        combined[b * 4 + 3] = 255;

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }

    sourceImages = [];
    postMessage(combined.buffer, [combined.buffer]);
    close();
}

onmessage = function (message) {
    if (message.data === 'start nice') {
        mergeImages();
    } else if (message.data === 'start fast') {
        mergeImages();
    } else if (message.data.byteLength) {
        sourceImages.push(new Uint8Array(message.data));
    } else {
        imageWidth = message.data;
    }
};
