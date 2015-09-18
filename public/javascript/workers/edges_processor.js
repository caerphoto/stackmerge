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


function mergeImages(lowQuality) {
    var combined = new Uint8Array(sourceImages[0].length);
    var dataSize = sourceImages[0].length / 4;

    var blurredImages = [];
    var focusMasks = [];
    var blurredFocusMasks = [];

    var b;
    var b4;

    var imageIndex;
    var numImages = sourceImages.length;
    var stackPixels = new Uint8Array(numImages);

    // By 16.666 (i.e. 100 / 6) because each instance of this worker only
    // handles half the image data, and we loop through the pixel data three
    // times. In low quality mode we only loop through twice, skipping the
    // final blurring pass.
    var onePercent = lowQuality ?
        Math.round(dataSize / 25) :
        Math.round(dataSize / 16.6666);


    function createBlurredSource() {
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

    }

    if (lowQuality) {
        // Set up buffers for blurred image data.
        for (imageIndex = 0; imageIndex < numImages; imageIndex += 1) {
            blurredImages[imageIndex] = new Uint8Array(dataSize);
        }

        // First pass creates a gaussian-blurred copy of the green channel of
        // each source image. This is common to both low and high quality
        // merges.
        createBlurredSource();

        // Second pass applies Laplacian edge detection on the blurred images,
        // and the index of the image with the strongest edge is used to index
        // the source image at each pixel location.
        calculateOffsets(1);
        for (b = 0; b !== dataSize; b += 1) {
            for (imageIndex = 0; imageIndex !== numImages; imageIndex += 1) {
                stackPixels[imageIndex] = abs(pixelByApplyingMatrix(
                    matrixLaplacian,
                    blurredImages[imageIndex],
                    b
                ));
            }

            b4 = b * 4;
            imageIndex = indexOfMax(stackPixels, numImages);
            combined[b4] = sourceImages[imageIndex][b4];
            combined[b4 + 1] = sourceImages[imageIndex][b4 + 1];
            combined[b4 + 2] = sourceImages[imageIndex][b4 + 2];
            combined[b4 + 3] = 255;

            if (b % onePercent === 0) {
                postMessage(null);
            }
        }

    } else {
        // Set up buffers for blurred image data and focus masks.
        for (imageIndex = 0; imageIndex < numImages; imageIndex += 1) {
            blurredImages[imageIndex] = new Uint8Array(dataSize);
            focusMasks[imageIndex] = new Uint8Array(dataSize);
            blurredFocusMasks[imageIndex] = new Uint8Array(dataSize);
        }

        createBlurredSource();

        // Second pass applies Laplacian edge detection on each of the blurred
        // images to create a focus mask for each one.
        calculateOffsets(1);
        for (b = 0; b !== dataSize; b += 1) {
            for (imageIndex = 0; imageIndex !== numImages; imageIndex += 1) {
                focusMasks[imageIndex][b] = abs(pixelByApplyingMatrix(
                    matrixLaplacian,
                    blurredImages[imageIndex],
                    b
                ));
            }
            if ((b + 1) % onePercent === 0) {
                postMessage(null);
            }
        }

        // Third pass finds the pixel in a gaussian blurred version of each
        // focus mask image with the highest value. The index of this image is
        // used as the index into the stack of source images.
        for (b = 0; b !== dataSize; b += 1) {
            for (imageIndex = 0; imageIndex !== numImages; imageIndex += 1) {
                stackPixels[imageIndex] = pixelByApplyingMatrix(
                    matrixGaussian,
                    focusMasks[imageIndex],
                    b
                ) / 16;
            }

            b4 = b * 4;
            imageIndex = indexOfMax(stackPixels, numImages);
            combined[b4] = sourceImages[imageIndex][b4];
            combined[b4 + 1] = sourceImages[imageIndex][b4 + 1];
            combined[b4 + 2] = sourceImages[imageIndex][b4 + 2];
            combined[b4 + 3] = 255;

            if ((b + 1) % onePercent === 0) {
                postMessage(null);
            }
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
        mergeImages(true);
    } else if (message.data.byteLength) {
        sourceImages.push(new Uint8Array(message.data));
    } else {
        imageWidth = message.data;
    }
};
