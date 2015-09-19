/*global postMessage, onmessage:true */
var sourceImages = [];

var abs = Math.abs;

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

function calculateOffsets(channels, imageWidth) {
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

function createFocusMasks(numImages, dataSize, imageWidth, onePercent) {
    var blurredImages = [];
    var masks = [];
    var imageIndex;
    var b, b4;

    for (imageIndex = 0; imageIndex < numImages; imageIndex += 1) {
        blurredImages[imageIndex] = new Uint8Array(dataSize);
        masks[imageIndex] = new Uint8Array(dataSize);
    }

    console.time('blurred images');
    calculateOffsets(4, imageWidth);
    for (imageIndex = 0; imageIndex !== numImages; imageIndex += 1) {
        for (b = 0, b4 = 1; b !== dataSize; b += 1, b4 += 4) {
            blurredImages[imageIndex][b] = pixelByApplyingMatrix(
                matrixGaussian,
                sourceImages[imageIndex],
                b4
            ) / 16;

        }

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }
    console.timeEnd('blurred images');

    console.time('edge detect');
    calculateOffsets(1, imageWidth);
    for (imageIndex = 0; imageIndex !== numImages; imageIndex += 1) {
        for (b = 0; b !== dataSize; b += 1) {
            masks[imageIndex][b] = abs(pixelByApplyingMatrix(
                matrixLaplacian,
                blurredImages[imageIndex],
                b
            ));
        }

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }
    console.timeEnd('edge detect');

    return masks;
}


function mergeImages(highQuality, numWorkers, imageWidth) {
    var combined = new Uint8Array(sourceImages[0].length);
    var dataSize = sourceImages[0].length / 4;

    var focusMasks;

    var b;
    var b4;

    var imageIndex;
    var numImages = sourceImages.length;
    var stackPixels = new Uint8Array(numImages);

    var numPasses = highQuality ? 3 : 2;
    var onePercent = Math.round(dataSize / (100 / (numWorkers * numPasses)));

    focusMasks = createFocusMasks(numImages, dataSize, imageWidth, onePercent);

    console.time('blurred from source');
    for (b = 0, b4 = 0; b !== dataSize; b += 1, b4 += 4) {
        for (imageIndex = 0; imageIndex !== numImages; imageIndex += 1) {
            if (highQuality) {
                stackPixels[imageIndex] = pixelByApplyingMatrix(
                    matrixGaussian,
                    focusMasks[imageIndex],
                    b
                ) / 16;
            } else {
                stackPixels[imageIndex] = focusMasks[imageIndex][b];

            }
        }

        imageIndex = indexOfMax(stackPixels, numImages);
        combined[b4] = sourceImages[imageIndex][b4];
        combined[b4 + 1] = sourceImages[imageIndex][b4 + 1];
        combined[b4 + 2] = sourceImages[imageIndex][b4 + 2];
        combined[b4 + 3] = 255;

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }
    console.timeEnd('blurred from source');

    sourceImages = [];
    postMessage(combined.buffer, [combined.buffer]);
    close();
}

onmessage = function (message) {
    var data = message.data;
    if (data.imageWidth) {
        mergeImages(data.highQuality, data.numWorkers, data.imageWidth);
    } else if (data.byteLength) {
        sourceImages.push(new Uint8Array(data));
    }
};
