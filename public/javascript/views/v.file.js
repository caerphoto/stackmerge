define([
    'backbone'
], function (
    Backbone
) {
    var FileView = Backbone.View.extend({
        el: 'body',
        events: {
            'click button.choose': 'showFilePicker',
            'change input.choose': 'filesChosen',
            'click button.remove-all': 'removeAll',
            'dragenter .image-stack.pane': 'onDragEnter',
            'dragover .drop-overlay': 'onDragOver',
            'dragleave .drop-overlay': 'onDragLeave',
            'drop .drop-overlay': 'onDrop',
            'click .save': 'encodeCanvasImage'
        },
        jpegWorker: new Worker('/assets/javascript/workers/jpeg_encoder.js'),

        initialize: function (options) {
            this.elFileInput = this.$('input.choose').get(0);
            this.$pane = this.$('.image-stack.pane');
            this.$saveButton = this.$('.save');
            this.images = options.images;
            this.previewModel = options.previewModel;
            this.jpegWorker.addEventListener('message', this.onWorkerMessage.bind(this));
        },

        showFilePicker: function () {
            this.elFileInput.click();
        },

        removeAll: function () {
            this.images.reset();
        },

        onDragEnter: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.$pane.addClass('dragging');
        },
        onDragOver: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
        },
        onDragLeave: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.$pane.removeClass('dragging');
        },
        onDrop: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.images.addFromFiles(evt.originalEvent.dataTransfer.files);
            this.$pane.removeClass('dragging');
        },
        filesChosen: function () {
            this.images.addFromFiles(this.elFileInput.files);
        },
        onWorkerMessage: function (message) {
            function padDigits(number) {
                return number < 10 ? '0' + number : number;
            }

            var link = document.createElement('a');
            var evt;
            var url;
            var imageBlob;

            var now = new Date();
            var dateParts = [now.getMonth() + 1, now.getDate()].map(padDigits);
            var timeParts = [
                now.getHours(),
                now.getMinutes(),
                now.getSeconds()
            ].map(padDigits).join('-');
            dateParts = [now.getFullYear()].concat(dateParts).join('-');

            link.download = [
                'StackMerge',
                dateParts,
                timeParts
            ].join(' ') + '.jpg';

            evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window,
                0, 0, 0, 0, 0,
                false, false, false, false,
                0, null);

            imageBlob = new Blob([message.data], { type: 'image/jpeg' });
            url = URL.createObjectURL(imageBlob);
            link.href = url;
            link.dispatchEvent(evt);

            this.previewModel.set('progress', false);
        },
        encodeCanvasImage: function () {
            var canvas = document.querySelector('.preview-image');
            var ctx = canvas.getContext('2d');
            var imageData;

            if (this.previewModel.get('progress') !== false) {
                return;
            }

            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            this.jpegWorker.postMessage(imageData, [imageData.data.buffer]);
            this.previewModel.set({
                progress: 0,
                processingMessage: 'Generating JPEG image'
            });
        }

    });

    return FileView;
});
