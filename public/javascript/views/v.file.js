'use strict';
define([
    'backbone'
], function (
    Backbone
) {
    var FileView = Backbone.View.extend({
        el: 'body',
        events: {
            'click .preview.pane': 'hideLinkPanel',
            'click button.choose': 'showFilePicker',
            'change input.choose': 'filesChosen',
            'click button.load-demo-images': 'loadDemoImages',
            'click button.remove-all': 'removeAll',
            'dragenter .image-stack.pane': 'onDragEnter',
            'dragover .drop-overlay': 'onDragOver',
            'dragleave .drop-overlay': 'onDragLeave',
            'drop .drop-overlay': 'onDrop',
            'click .save': 'encodeCanvasImage',
            'click .download-link': 'hideLinkPanel'
        },

        initialize: function (options) {
            this.elFileInput = this.$('input.choose').get(0);
            this.$pane = this.$('.image-stack.pane');
            this.$saveButton = this.$('.save');
            this.$downloadLinkPanel = this.$('.download-link-panel');
            this.images = options.images;
            this.previewModel = options.previewModel;
            this.jpegWorker = new Worker(options.jpegWorkerPath);
            this.jpegWorker.onmessage = this.onWorkerMessage.bind(this);
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
        loadDemoImages: function (evt) {
            var urls = evt.target.getAttribute('data-urls').split('\n');
            this.images.addFromUrls(urls);
        },
        filesChosen: function () {
            this.images.addFromFiles(this.elFileInput.files);
        },
        onWorkerMessage: function (message) {
            function padDigits(number) {
                return number < 10 ? '0' + number : number;
            }

            if (message.data === null) {
                this.previewModel.increment('progress');
                return;
            }

            var link = this.$downloadLinkPanel.find('a.download-link')[0];
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
            imageBlob = new Blob([message.data], { type: 'image/jpeg' });
            link.href = URL.createObjectURL(imageBlob);

            link.target = '_blank';
            link.appendChild(document.createTextNode('Click to download image'));

            this.$downloadLinkPanel.toggleClass('visible', true);
            link.focus();

            this.previewModel.set('progress', false);
        },
        showLinkPanel: function () {
            this.$downloadLinkPanel.toggleClass('visible', true);
        },
        hideLinkPanel: function () {
            this.$downloadLinkPanel.toggleClass('visible', false);
        },
        encodeCanvasImage: function () {
            var canvas = document.querySelector('.preview-image');
            var ctx = canvas.getContext('2d');
            var imageData;

            if (this.previewModel.get('progress') !== false) {
                return;
            }

            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            imageData.quality = 80;
            this.jpegWorker.postMessage(imageData, [imageData.data.buffer]);
            this.previewModel.set({
                progress: 0,
                processingMessage: 'Generating JPEG image'
            });
        }

    });

    return FileView;
});
