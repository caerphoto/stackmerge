define([
    'backbone'
], function (
    Backbone
) {
    var UploadView = Backbone.View.extend({
        el: 'body',
        events: {
            'click button.choose': 'showFilePicker',
            'change input.choose': 'filesChosen',
            'dragenter .image-stack.pane': 'onDragEnter',
            'dragover .image-stack.pane': 'onDragOver',
            'dragleave .image-stack.pane': 'onDragLeave',
            'drop .image-stack.pane': 'onDrop',
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
        }

    });

    return UploadView;
});
