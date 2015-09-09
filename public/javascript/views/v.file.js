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
            'dragenter .image-stack.pane': 'onDragEnter',
            'dragover .drop-overlay': 'onDragOver',
            'dragleave .drop-overlay': 'onDragLeave',
            'drop .drop-overlay': 'onDrop',
            'click .save': 'saveImage'
        },
        initialize: function (options) {
            this.elFileInput = this.$('input.choose').get(0);
            this.$pane = this.$('.image-stack.pane');
            this.images = options.images;
        },

        // Custom methods
        showFilePicker: function () {
            this.elFileInput.click();
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
        saveImage: function () {
            function padDigits(number) {
                return number < 10 ? '0' + number : number;
            }

            var link = document.createElement('a');
            var canvas = document.querySelector('.preview-image');
            var evt;

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
            ].join(' ');

            link.href = canvas.toDataURL('image/jpeg', 0.8);
            evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window,
                0, 0, 0, 0, 0,
                false, false, false, false,
                0, null);
            link.dispatchEvent(evt);
        }

    });

    return FileView;
});
