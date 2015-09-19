/*global postMessage, onmessage:true */
var sourceImage;
var abs = Math.abs;
var offsets = [];

// Remember to divide by 16 after applying this matrix.
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

function createFocusMask(imageWidth) {
    var dataSize = sourceImage.buffer.byteLength / 4;
    var blurredImage = new Uint8Array(dataSize);
    var mask = new Uint8Array(dataSize);
    var b, b4;

    // Fudge the numbers slightly so percentage doesn't end up going over 100.
    var onePercent = Math.ceil(dataSize / 99 * 3);

    // First create a blurred copy of the source image.
    calculateOffsets(4, imageWidth);
    for (b = 0, b4 = 1; b !== dataSize; b += 1, b4 += 4) {
        blurredImage[b] = pixelByApplyingMatrix(
            matrixGaussian,
            sourceImage,
            b4
        ) / 16;

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }

    // Next create a focus mask by running edge detection on the blurred image.
    calculateOffsets(1, imageWidth);
    for (b = 0; b !== dataSize; b += 1) {
        mask[b] = abs(pixelByApplyingMatrix(
            matrixLaplacian,
            blurredImage,
            b
        ));

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }

    // Finally set the alpha channel of the source image to be a blurred version
    // of the focus mask.
    for (b = 0, b4 = 3; b !== dataSize; b += 1, b4 += 4) {
        sourceImage[b4] = pixelByApplyingMatrix(
            matrixGaussian,
            mask,
            b
        ) / 16;

        if (b % onePercent === 0) {
            postMessage(null);
        }
    }

    postMessage(sourceImage.buffer, [sourceImage.buffer]);
    close();
}

onmessage = function (message) {
    var data = message.data;
    if (data.imageWidth) {
        createFocusMask(data.imageWidth);
    } else if (data.byteLength) {
        sourceImage = new Uint8Array(data);
    }
};

