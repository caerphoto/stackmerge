define([
    'backbone',
    'underscore'
], function (
    Backbone,
    _
) {
    var UploadView = Backbone.View.extend({
        el: '.upload-controls',
        events: {
            'change input.choose': 'renderUploadList',
            'click .upload': 'uploadImages'
        },
        initialize: function (options) {
            this.elFileInput = this.$('input.choose').get(0);
            this.elUploadList = this.$('ol.upload-list').get(0);
            this.handleUploadData = options.onUpload;
        },
        renderUploadList: function () {
            var html = '<li>';
            var files = _.map(this.elFileInput.files, function (file) {
                return file.name;
            });

            this.elUploadList.innerHTML = html + files.join('</li><li>') + '</li>';
            this.$el.addClass('ready-to-upload');
        },
        uploadImages: function () {
            var xhr = new XMLHttpRequest();
            var formData = new FormData();

            _.each(this.elFileInput.files, function (file) {
                if (/image\//.test(file.type)) {
                    formData.append('images', file, file.name);
                }
            });

            xhr.open('POST', 'upload', true);
            xhr.onload = _.bind(function () {
                if (xhr.status === 200) {
                    this.handleUploadData(xhr.responseText);
                } else {
                    console.log(xhr.status, xhr.responseText);
                }
                this.$el.removeClass('uploading');
            }, this);

            this.$el.removeClass('ready-to-upload').addClass('uploading');
            xhr.send(formData);
        }
    });

    return UploadView;
});
