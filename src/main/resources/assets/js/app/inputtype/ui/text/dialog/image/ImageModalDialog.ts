import FormItem = api.ui.form.FormItem;
import Validators = api.ui.form.Validators;
import Action = api.ui.Action;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import ContentSummary = api.content.ContentSummary;
import eventInfo = CKEDITOR.eventInfo;
import ContentId = api.content.ContentId;
import AppHelper = api.util.AppHelper;
import ActionButton = api.ui.button.ActionButton;
import i18n = api.util.i18n;
import UploadedEvent = api.ui.uploader.UploadedEvent;
import UploadProgressEvent = api.ui.uploader.UploadProgressEvent;
import InputEl = api.dom.InputEl;
import DivEl = api.dom.DivEl;
import SpanEl = api.dom.SpanEl;
import {Content} from '../../../../../content/Content';
import {XDataName} from '../../../../../content/XDataName';
import {OverrideNativeDialog} from './../OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './../ModalDialog';
import {ImageStyleSelector} from './ImageStyleSelector';
import {MediaTreeSelectorItem} from '../../../selector/media/MediaTreeSelectorItem';
import {ImageUploaderEl} from '../../../selector/image/ImageUploaderEl';
import {ImageContentComboBox} from '../../../selector/image/ImageContentComboBox';
import {ContentSelectedOptionsView} from '../../../selector/ContentComboBox';
import {MediaUploaderElOperation} from '../../../upload/MediaUploaderEl';
import {GetContentByIdRequest} from '../../../../../resource/GetContentByIdRequest';
import {StylesRequest} from '../../styles/StylesRequest';
import {Styles} from '../../styles/Styles';
import {Style} from '../../styles/Style';
import {HTMLAreaHelper} from '../../HTMLAreaHelper';
import {ImageUrlResolver} from '../../../../../util/ImageUrlResolver';
import {StyleHelper} from '../../styles/StyleHelper';
import {HtmlEditor} from '../../HtmlEditor';

export class ImageModalDialog
    extends OverrideNativeDialog {

    private imagePreviewContainer: DivEl;
    private imageCaptionField: FormItem;
    private imageAltTextField: FormItem;
    private imageUploaderEl: ImageUploaderEl;
    private presetImageEl: HTMLElement;
    private content: api.content.ContentSummary;
    private imageSelector: ImageContentComboBox;
    private progress: api.ui.ProgressBar;
    private error: DivEl;
    private figure: api.dom.FigureEl;
    private imageToolbar: ImageDialogToolbar;
    private imagePreviewScrollHandler: ImagePreviewScrollHandler;
    private imageLoadMask: api.ui.mask.LoadMask;
    private dropzoneContainer: api.ui.uploader.DropzoneContainer;
    private imageSelectorFormItem: FormItem;
    private previewFrame: api.dom.IFrameEl;
    private scrollNavigationWrapperDiv: DivEl;
    private editorWidth: number;

    static readonly defaultStyles: any = [StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS];

    constructor(config: eventInfo, content: api.content.ContentSummary) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            content: content,
            title: i18n('dialog.image.title'),
            cls: 'image-modal-dialog',
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });

        this.editorWidth = config.editor.element.$.clientWidth || config.editor.element.getParent().$.clientWidth;
        this.figure = new api.dom.FigureEl();

        this.initLoader();

        this.initPresetImage();

        if (!Styles.getInstance()) {
            new StylesRequest(content.getId()).sendAndParse();
        }

    }

    private initPresetImage() {

        const selectedElement = this.ckeOriginalDialog.getSelectedElement();

        if (!this.getOriginalUrlElem().getValue() || !selectedElement) {
            return;
        }

        const presetFigureEl = selectedElement.findOne('figure');

        this.presetImageEl = !!presetFigureEl ? presetFigureEl.findOne('img').$ : selectedElement.findOne('img').$;

        if (this.presetImageEl) {
            const presetStyles = !!presetFigureEl ? presetFigureEl.getAttribute('class') : '';
            if (presetFigureEl && presetFigureEl.hasAttribute('style')) {
                this.figure.getEl().setAttribute('style', presetFigureEl.getAttribute('style'));
            }
            this.presetImage(presetStyles);
        }
    }

    protected initializeConfig(params: ImageModalDialogConfig) {
        super.initializeConfig(params);

        this.content = params.content;
    }

    protected setDialogInputValues() {
        const caption: string = !!this.ckeOriginalDialog.getSelectedElement()
                                ? this.ckeOriginalDialog.getSelectedElement().getText()
                                : '';
        (<api.dom.InputEl>this.imageCaptionField.getInput()).setValue(caption);
        (<api.dom.InputEl>this.imageAltTextField.getInput()).setValue(this.getOriginalAltTextElem().getValue());
    }

    private initLoader() {
        this.onRendered(() => {
            this.imageUploaderEl.setParams({
                parent: this.content.getContentId().toString()
            });
            this.imageUploaderEl.show();
        });
    }

    private presetImage(presetStyles: string) {
        const imageId: string = this.extractImageId();

        new GetContentByIdRequest(new ContentId(imageId)).sendAndParse().then((imageContent: Content) => {
            this.imageSelector.setValue(imageContent.getId());
            this.previewImage(imageContent, presetStyles);
            this.imageSelectorFormItem.addClass('selected-item-preview');
        }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).done();
    }

    private extractImageId(): string {
        const src: string = this.presetImageEl.getAttribute('data-src');

        if (!src) {
            throw new Error('Incorrectly formatted URL');
        }

        const imageId = HTMLAreaHelper.extractContentIdFromImgSrc(src);

        if (!imageId) {
            throw new Error('Incorrectly formatted URL');
        }

        return imageId;
    }

    protected getMainFormItems(): FormItem[] {
        this.imageSelectorFormItem = this.createImageSelector('imageId');

        this.imageSelectorFormItem.onRendered(() => {
            this.addUploaderAndPreviewControls();
            this.setFirstFocusField(this.imageSelectorFormItem.getInput());
        } );

        this.imageCaptionField = this.createFormItem(new ModalDialogFormItemBuilder('caption', i18n('dialog.image.formitem.caption')));
        this.imageAltTextField = this.createFormItem(new ModalDialogFormItemBuilder('altText', i18n('dialog.image.formitem.alttext')));

        this.imageCaptionField.addClass('caption').hide();
        this.imageAltTextField.addClass('alttext').hide();

        return [
            this.imageSelectorFormItem,
            this.imageCaptionField,
            this.imageAltTextField
        ];
    }

    private createImageSelector(id: string): FormItem {

        const imageSelector = ImageContentComboBox.create().setMaximumOccurrences(1).setContent(
            this.content).setSelectedOptionsView(new ContentSelectedOptionsView()).build();

        const formItemBuilder = new ModalDialogFormItemBuilder(id, i18n('dialog.image.formitem.image')).setValidator(
            Validators.required).setInputEl(imageSelector);

        const formItem = this.createFormItem(formItemBuilder);
        const imageSelectorComboBox = imageSelector.getComboBox();

        imageSelector.getComboBox().getInput().setPlaceholder(i18n('field.image.option.placeholder'));

        this.imageSelector = imageSelector;

        formItem.addClass('image-selector');

        imageSelectorComboBox.onOptionSelected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {
            const imageContent = event.getSelectedOption().getOption().displayValue;
            if (!imageContent.getContentId()) {
                return;
            }

            this.previewImage(imageContent.getContent());
            formItem.addClass('selected-item-preview');
            this.setAltTextFieldValue(imageContent.getDisplayName());
            this.fetchImageCaption(imageContent.getContentSummary()).then(value => this.setCaptionFieldValue(value)).catch(
                (reason: any) => api.DefaultErrorHandler.handle(reason)).done();
        });

        imageSelectorComboBox.onOptionDeselected(() => {
            formItem.removeClass('selected-item-preview');
            this.displayValidationErrors(false);
            this.removePreview();
            this.imageToolbar.unStylesChanged();
            this.imageToolbar.unPreviewSizeChanged();
            this.imageToolbar.remove();
            this.imageCaptionField.hide();
            this.imageAltTextField.hide();
            this.imageUploaderEl.show();
            this.imagePreviewScrollHandler.toggleScrollButtons();
            this.figure.getEl().removeAttribute('style');
            api.ui.responsive.ResponsiveManager.fireResizeEvent();
        });

        return formItem;
    }

    private addUploaderAndPreviewControls() {
        const imageSelectorContainer = this.imageSelectorFormItem.getInput().getParentElement();
        this.imageUploaderEl = this.createImageUploader();

        imageSelectorContainer.appendChild(this.imageUploaderEl);
        this.initDragAndDropUploaderEvents();

        this.createImagePreviewContainer();

        this.scrollNavigationWrapperDiv = new DivEl('preview-panel-scroll-navigation-wrapper');
        const scrollBarWrapperDiv = new DivEl('preview-panel-scrollbar-wrapper');

        scrollBarWrapperDiv.appendChild(this.imagePreviewContainer);
        this.scrollNavigationWrapperDiv.appendChild(scrollBarWrapperDiv);

        this.scrollNavigationWrapperDiv.insertAfterEl(imageSelectorContainer);

        this.imagePreviewScrollHandler = new ImagePreviewScrollHandler(this.imagePreviewContainer);

        this.imageLoadMask = new api.ui.mask.LoadMask(this.imagePreviewContainer);

        this.imagePreviewContainer.appendChild(<api.dom.Element>this.imageLoadMask);

        api.ui.responsive.ResponsiveManager.onAvailableSizeChanged(this, () => {
            this.imagePreviewScrollHandler.toggleScrollButtons();
            this.imagePreviewScrollHandler.setMarginRight();
        });
    }

    private createPreviewFrame() {
        const appendStylesheet = (head, cssPath) => {
            const linkEl = new api.dom.LinkEl(cssPath, 'stylesheet');
            linkEl.getEl().setAttribute('type', 'text/css');
            head.appendChild(linkEl.getHTMLElement());
        };
        const injectCssIntoFrame = (head) => {
            if (Styles.getInstance()) {
                Styles.getCssPaths().forEach(cssPath => appendStylesheet(head, cssPath));
            }
        };

        this.previewFrame = new api.dom.IFrameEl('preview-frame');

        this.imagePreviewContainer.insertChild(this.previewFrame, 0);

        this.previewFrame.onRendered(() => {

            setTimeout(() => {

                const frameDocument = this.previewFrame.getHTMLElement()['contentDocument'];
                const frameBody = frameDocument.getElementsByTagName('body')[0];
                const frameBodyEl = new api.dom.Body(false, frameBody);
                frameBodyEl.setClass('preview-frame-body');

                frameBodyEl.appendChild(this.figure);

                injectCssIntoFrame(frameDocument.getElementsByTagName('head')[0]);
            }, 50);
        });

    }

    private updatePreview(styles: string) {
        this.applyStylingToPreview(styles);
        this.updateImageSrc(this.figure.getImage().getHTMLElement(), this.imagePreviewContainer.getEl().getWidth());
        this.figure.getImage().refresh();

        this.imagePreviewScrollHandler.resetScrollPosition();
    }

    private adjustPreviewFrameHeight() {
        this.previewFrame.getEl().setHeightPx(this.figure.getImage().getEl().getHeight());
    }

    private previewImage(imageContent: ContentSummary, presetStyles?: string) {
        if (!this.previewFrame) {
            this.createPreviewFrame();
        }

        this.imageLoadMask.show();

        this.figure.setClass(presetStyles || ImageModalDialog.defaultStyles.join(' ').trim());

        const onImageFirstLoad = () => {
            this.imagePreviewContainer.removeClass('upload');

            this.imageToolbar = new ImageDialogToolbar(this.figure);
            this.imageToolbar.onStylesChanged((styles: string) => this.updatePreview(styles));
            this.imageToolbar.onPreviewSizeChanged(() => this.adjustPreviewFrameHeight());

            wemjq(this.imageToolbar.getHTMLElement()).insertBefore(this.scrollNavigationWrapperDiv.getHTMLElement());

            image.unLoaded(onImageFirstLoad);
        };

        const image = this.createImgElForPreview(imageContent);
        image.onLoaded(onImageFirstLoad);

        image.onLoaded(() => {
            this.adjustPreviewFrameHeight();
            this.imageLoadMask.hide();

            api.ui.responsive.ResponsiveManager.fireResizeEvent();
        });

        this.figure.setImage(image);

        this.hideUploadMasks();
        this.imageCaptionField.show();
        this.imageAltTextField.show();
        this.imageUploaderEl.hide();
    }


    private createImageUrlResolver(imageContent: ContentSummary, size?: number, style?: Style): ImageUrlResolver {

        const imgUrlResolver = new ImageUrlResolver()
            .setContentId(imageContent.getContentId())
            .setTimestamp(imageContent.getModifiedTime());

        if (size) {
            imgUrlResolver.setSize(size);
        }

        if (style) {

            if (StyleHelper.isOriginalImage(style.getName())) {
                imgUrlResolver.disableProcessing();
            }

            imgUrlResolver
                .setAspectRatio(style.getAspectRatio())
                .setFilter(style.getFilter());
        }

        return imgUrlResolver;
    }

    private createImgElForPreview(imageContent: ContentSummary): api.dom.ImgEl {
        let imgSrcAttr = '';
        let imgDataSrcAttr = '';

        if (!!this.presetImageEl) {
            imgSrcAttr = this.presetImageEl.getAttribute('src');
            imgDataSrcAttr = this.presetImageEl.getAttribute('data-src');
        } else {

            const imageUrlBuilder = this.createImageUrlResolver(imageContent, this.imagePreviewContainer.getEl().getWidth());

            imgSrcAttr = imageUrlBuilder.resolveForPreview();
            imgDataSrcAttr = imageUrlBuilder.resolveForRender();
        }

        const imageEl = new api.dom.ImgEl(imgSrcAttr);
        imageEl.getEl().setAttribute('data-src', imgDataSrcAttr);

        return imageEl;
    }

    private removePreview() {
        this.figure.removeChildren();
        this.previewFrame.getEl().setHeightPx(0);
        this.presetImageEl = null;
    }

    private createImagePreviewContainer() {
        const imagePreviewContainer = new DivEl('content-item-preview-panel');

        this.progress = new api.ui.ProgressBar();
        imagePreviewContainer.appendChild(this.progress);

        this.error = new DivEl('error');
        imagePreviewContainer.appendChild(this.error);

        this.imagePreviewContainer = imagePreviewContainer;
    }

    private createImageUploader(): ImageUploaderEl {
        const uploader = new ImageUploaderEl({
            operation: MediaUploaderElOperation.create,
            name: 'image-selector-upload-dialog',
            showResult: false,
            maximumOccurrences: 1,
            allowMultiSelection: false,
            deferred: true,
            showCancel: false,
            selfIsDropzone: false
        });

        this.dropzoneContainer = new api.ui.uploader.DropzoneContainer(true);
        this.dropzoneContainer.hide();
        this.appendChild(this.dropzoneContainer);

        uploader.addDropzone(this.dropzoneContainer.getDropzone().getId());

        uploader.hide();

        uploader.onUploadStarted(() => {
            this.hideUploadMasks();
            this.imagePreviewContainer.addClass('upload');
            this.showProgress();
        });

        uploader.onUploadProgress((event: UploadProgressEvent<Content>) => {
            const item = event.getUploadItem();

            this.setProgress(item.getProgress());
        });

        uploader.onFileUploaded((event: UploadedEvent<Content>) => {
            const item = event.getUploadItem();
            const createdContent = item.getModel();

            this.imageSelector.setContent(createdContent);
        });

        uploader.onUploadFailed(() => {
            this.showError('Upload failed');
        });

        return uploader;
    }

    private initDragAndDropUploaderEvents() {
        let dragOverEl;
        this.onDragEnter((event: DragEvent) => {
            if (this.imageUploaderEl.isEnabled()) {
                const target = <HTMLElement> event.target;

                if (!!dragOverEl || dragOverEl === this.getHTMLElement()) {
                    this.dropzoneContainer.show();
                }
                dragOverEl = target;
            }
        });

        this.imageUploaderEl.onDropzoneDragLeave(() => this.dropzoneContainer.hide());
        this.imageUploaderEl.onDropzoneDrop(() => this.dropzoneContainer.hide());
    }

    private setProgress(value: number) {
        this.progress.setValue(value);
    }

    private showProgress() {
        this.progress.show();
    }

    private hideUploadMasks() {
        this.progress.hide();
        this.error.hide();
    }

    private showError(text: string) {
        this.progress.hide();
        this.error.setHtml(text).show();
        this.error.show();
    }

    protected initializeActions() {
        const submitAction = new api.ui.Action(!!this.presetImageEl ? 'Update' : 'Insert');
        this.setSubmitAction(submitAction);
        this.addAction(submitAction.onExecuted(() => {
            this.displayValidationErrors(true);
            if (this.validate()) {
                this.updateOriginalDialogInputValues();
                this.ckeOriginalDialog.getButton('ok').click();
                this.updateEditorElements();
                this.close();
            }
        }));

        super.initializeActions();
    }

    private updateEditorElements() {
        const imageEl: CKEDITOR.dom.element = (<any>this.ckeOriginalDialog).widget.parts.image;
        const figureEl: CKEDITOR.dom.element = <CKEDITOR.dom.element>imageEl.getAscendant('figure');
        const figureCaptionEl: CKEDITOR.dom.element = figureEl.findOne('figcaption');

        figureEl.setAttribute('class', `${this.figure.getClass()}`);
        figureEl.removeAttribute('style');

        if (this.figure.getEl().hasAttribute('style') && !!this.figure.getEl().getAttribute('style')) {
            figureEl.setAttribute('style', this.figure.getEl().getAttribute('style'));
        }

        imageEl.removeAttribute('class');
        imageEl.removeAttribute('style');

        this.updateImageSrc(imageEl.$, this.editorWidth);
        HtmlEditor.updateImageInlineStyle(figureEl);

        figureCaptionEl.setText(this.getCaptionFieldValue());
    }

    private updateOriginalDialogInputValues(): void {
        const image = this.figure.getImage();
        const src: string = image.getEl().getAttribute('src');
        const altText: string = this.getAltTextFieldValue();
        const alignment: string = this.imageToolbar.getAlignment();

        this.getOriginalUrlElem().setValue(src, true);
        this.getOriginalAltTextElem().setValue(altText, false);
        this.getOriginalHasCaptionElem().setValue(true, false);
        this.getOriginalAlignmentElem().setValue(alignment, false);
    }

    private setCaptionFieldValue(value: string) {
        (<api.dom.InputEl>this.imageCaptionField.getInput()).setValue(value);
    }

    private getCaptionFieldValue() {
        return (<api.dom.InputEl>this.imageCaptionField.getInput()).getValue().trim();
    }

    private getAltTextFieldValue() {
        return (<api.dom.InputEl>this.imageAltTextField.getInput()).getValue().trim();
    }

    private setAltTextFieldValue(value: string) {
        (<api.dom.InputEl>this.imageAltTextField.getInput()).setValue(value);
    }

    private fetchImageCaption(imageContent: ContentSummary): wemQ.Promise<string> {
        return new GetContentByIdRequest(imageContent.getContentId()).sendAndParse()
            .then((content: Content) => {
                return this.getDescriptionFromImageContent(content) || content.getProperty('caption').getString() || '';
            });
    }

    private getDescriptionFromImageContent(imageContent: Content): string {
        const imageInfoMixin = new XDataName('media:imageInfo');
        const imageInfoData = imageContent.getExtraData(imageInfoMixin);

        if (!imageInfoData || !imageInfoData.getData()) {
            return null;
        }

        const descriptionProperty = imageInfoData.getData().getProperty('description');

        if (descriptionProperty) {
            const description = descriptionProperty.getString();
            if (description) {
                return description;
            }
        }

        return null;
    }

    private getOriginalUrlElem(): CKEDITOR.ui.dialog.uiElement {
        return (<any>this.getElemFromOriginalDialog('info', undefined)).getChild(0);
    }

    private getOriginalAltTextElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'alt');
    }

    private getOriginalHasCaptionElem(): CKEDITOR.ui.dialog.checkbox {
        return <CKEDITOR.ui.dialog.checkbox>this.getElemFromOriginalDialog('info', 'hasCaption');
    }

    private getOriginalAlignmentElem(): CKEDITOR.ui.dialog.uiElement {
        return (<any>this.getElemFromOriginalDialog('info', 'alignment')).getChild(0);
    }

    isDirty(): boolean {
        return AppHelper.isDirty(this);
    }

    private updateImageSrc(imageEl: HTMLElement, width: number) {
        const imageContent = this.imageSelector.getSelectedContent();
        const processingStyle = this.imageToolbar.getProcessingStyle();

        const imageUrlBuilder = this.createImageUrlResolver(imageContent, width, processingStyle);

        imageEl.setAttribute('src', imageUrlBuilder.resolveForPreview());
        imageEl.setAttribute('data-src', imageUrlBuilder.resolveForRender());
    }

    private applyStylingToPreview(classNames: string) {
        this.figure.setClass('captioned ' + classNames);
        const ckeFigure: CKEDITOR.dom.element = new CKEDITOR.dom.element(this.figure.getHTMLElement());
        HtmlEditor.updateFigureInlineStyle(ckeFigure);
        HtmlEditor.sortFigureClasses(ckeFigure);
    }
}

export class ImageModalDialogConfig
    extends HtmlAreaModalDialogConfig {
    content: api.content.ContentSummary;
}

export class ImageDialogToolbar
    extends api.ui.toolbar.Toolbar {

    private previewEl: api.dom.FigureEl;

    private alignmentButtons: { [key: string]: ActionButton; } = {};

    private customWidthCheckbox: api.ui.Checkbox;

    private imageStyleSelector: ImageStyleSelector;

    private customWidthRangeInput: InputEl;

    private rangeInputContainer: DivEl;

    private widthBoard: SpanEl;

    private stylesChangeListeners: { (styles: string): void }[] = [];
    private previewSizeChangeListeners: { (): void }[] = [];

    constructor(previewEl: api.dom.FigureEl) {
        super('image-toolbar');

        this.previewEl = previewEl;

        this.createElements();
    }

    private createElements() {
        const topLineContainer: DivEl = new DivEl('image-toolbar-top-line');

        topLineContainer.appendChild(this.createAlignmentButtons());
        topLineContainer.appendChild(this.imageStyleSelector = this.createImageStyleSelector());
        topLineContainer.appendChild(this.customWidthCheckbox = this.createCustomWidthCheckbox());

        super.addElement(topLineContainer);
        super.addElement(this.createCustomWidthRangeInput());
    }

    private createAlignmentButtons(): DivEl {
        const alignmentButtonContainer = new DivEl('alignment-container');

        alignmentButtonContainer.appendChildren(
            this.createAlignmentButton('icon-paragraph-justify', StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS),
            this.createAlignmentButton('icon-paragraph-left', StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS),
            this.createAlignmentButton('icon-paragraph-center', StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS),
            this.createAlignmentButton('icon-paragraph-right', StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)
        );

        return alignmentButtonContainer;
    }

    private createAlignmentButton(iconClass: string, styleClass: string): api.ui.button.ActionButton {
        const action: Action = new Action('');

        action.setIconClass(iconClass);

        const button = new api.ui.button.ActionButton(action);

        action.onExecuted(() => {
            this.resetActiveAlignmentButton();
            button.addClass('active');

            this.notifyStylesChanged();
        });

        this.alignmentButtons[styleClass] = button;

        if (this.previewEl.hasClass(styleClass)) {
            button.addClass('active');
        }

        return button;
    }

    private createCustomWidthCheckbox(): api.ui.Checkbox {
        const isChecked: boolean = this.previewEl.hasClass(StyleHelper.STYLE.WIDTH.CUSTOM);
        const checkbox = api.ui.Checkbox.create().setChecked(isChecked).build();

        checkbox.addClass('custom-width-checkbox');
        checkbox.setLabel(i18n('dialog.image.customwidth'));

        if (StyleHelper.isOriginalImage(this.getProcessingStyleCls())) {
            checkbox.setDisabled(true, 'disabled');
        }

        checkbox.onChange(() => {
            if (checkbox.isChecked()) {
                this.previewEl.addClass(StyleHelper.STYLE.WIDTH.CUSTOM);
                this.rangeInputContainer.show();
                const width: string = this.getAlignmentWidth();
                this.customWidthRangeInput.getHTMLElement()['value'] = width;
                this.widthBoard.setHtml(`${width}%`);
                this.updatePreviewCustomWidth(width);
            } else {
                this.previewEl.removeClass(StyleHelper.STYLE.WIDTH.CUSTOM);
                this.previewEl.getEl().removeAttribute('style');
                this.rangeInputContainer.hide();
            }
        });

        return checkbox;
    }

    private getAlignmentWidth(): string {
        if (this.previewEl.hasClass(StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS)) {
            return StyleHelper.STYLE.ALIGNMENT.LEFT.WIDTH;
        }

        if (this.previewEl.hasClass(StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)) {
            return StyleHelper.STYLE.ALIGNMENT.RIGHT.WIDTH;
        }

        if (this.previewEl.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) {
            return StyleHelper.STYLE.ALIGNMENT.CENTER.WIDTH;
        }

        return '100';
    }

    private createCustomWidthRangeInput(): DivEl {
        this.customWidthRangeInput = new InputEl('custom-width-range', 'range');
        this.widthBoard = new SpanEl('custom-width-board');
        this.rangeInputContainer = new DivEl('custom-width-range-container');

        this.customWidthRangeInput.getEl().setAttribute('min', '0');
        this.customWidthRangeInput.getEl().setAttribute('max', '100');
        this.customWidthRangeInput.getEl().setAttribute('step', '1');

        if (this.previewEl.hasClass(StyleHelper.STYLE.WIDTH.CUSTOM)) {
            const value: string = this.previewEl.getHTMLElement().style.width;
            this.customWidthRangeInput.getHTMLElement()['value'] = value.replace('%', '');
            this.widthBoard.setHtml(value);
        } else {
            this.rangeInputContainer.hide();
        }

        this.customWidthRangeInput.onChange((event: Event) => {
            const value: string = event.srcElement['value'];
            this.updatePreviewCustomWidth(value);
            this.widthBoard.setHtml(`${value}%`);
            this.notifyPreviewSizeChanged();
        });

        this.customWidthRangeInput.onInput((event: Event) => {
            const value: string = event.srcElement['value'];
            this.updatePreviewCustomWidth(value);
            this.widthBoard.setHtml(`${value}%`);
        });

        this.rangeInputContainer.appendChild(this.customWidthRangeInput);
        this.rangeInputContainer.appendChild(this.widthBoard);

        if (!this.previewEl.hasClass(StyleHelper.STYLE.WIDTH.CUSTOM)) {
            this.rangeInputContainer.hide();
        }

        return this.rangeInputContainer;
    }

    private updatePreviewCustomWidth(value: string) {
        this.previewEl.getEl().setWidth(`${value}%`);
    }

    private createImageStyleSelector(): ImageStyleSelector {
        const imageStyleSelector: ImageStyleSelector = new ImageStyleSelector();

        this.initSelectedStyle(imageStyleSelector);
        imageStyleSelector.onOptionSelected(() => {
            if (StyleHelper.isOriginalImage(this.getProcessingStyleCls())) {
                this.customWidthCheckbox.setChecked(false).setDisabled(true, 'disabled');
                this.rangeInputContainer.hide();
                this.previewEl.getEl().removeAttribute('style');
            } else {
                this.customWidthCheckbox.setDisabled(false, 'disabled');
            }

            this.notifyStylesChanged();
        });

        return imageStyleSelector;
    }

    private initSelectedStyle(imageStyleSelector: ImageStyleSelector) {
        const previewStyles: string = this.previewEl.getClass();
        const stylesApplied = previewStyles ? previewStyles.trim().split(' ') : null;

        if (!stylesApplied) {
            return;
        }

        const imageStyles = Styles.getForImageAsString();
        stylesApplied.forEach(style => {
            if (imageStyles.indexOf(style) > -1) {
                imageStyleSelector.setValue(style);

                return;
            }
        });
    }

    private getAlignmentStyleCls(): string {

        for (let alignment in this.alignmentButtons) {
            if (this.alignmentButtons[alignment].hasClass('active')) {
                return alignment.toString();
            }
        }

        return '';
    }

    getAlignment(): string {

        for (let alignment in this.alignmentButtons) {
            if (this.alignmentButtons[alignment].hasClass('active')) {
                return alignment.toString().replace('editor-align-', '');
            }
        }

        return 'justify';
    }

    private getProcessingStyleCls(): string {
        if (this.isProcessingStyleSelected()) {
            return this.imageStyleSelector.getSelectedOption().displayValue.getName();
        }

        return '';
    }

    private resetActiveAlignmentButton() {

        // tslint:disable-next-line
        for (let alignment in this.alignmentButtons) {
            this.alignmentButtons[alignment].removeClass('active');
        }
    }

    private isProcessingStyleSelected(): boolean {
        return (!!this.imageStyleSelector &&
                !!this.imageStyleSelector.getSelectedOption() &&
                !this.imageStyleSelector.getSelectedOption().displayValue.isEmpty());
    }

    getProcessingStyle(): Style {
        if (this.isProcessingStyleSelected()) {
            return this.imageStyleSelector.getSelectedOption().displayValue.getStyle();
        }

        return;
    }

    private getStyleCls(): string {
        const classes: string[] = [];

        const alignStyleCls: string = this.getAlignmentStyleCls();
        const processingStyleCls: string = this.getProcessingStyleCls();

        if (alignStyleCls) {
            classes.push(alignStyleCls);
        }

        if (processingStyleCls) {
            classes.push(processingStyleCls);
        }

        if (this.customWidthCheckbox.isChecked()) {
            classes.push(StyleHelper.STYLE.WIDTH.CUSTOM);
        }

        return classes.join(' ').trim();
    }

    onStylesChanged(listener: (styles: string) => void) {
        this.stylesChangeListeners.push(listener);
    }

    unStylesChanged() {
        this.stylesChangeListeners = [];
    }

    private notifyStylesChanged() {
        const styleClasses = this.getStyleCls();
        this.stylesChangeListeners.forEach(listener => listener(styleClasses));
    }

    onPreviewSizeChanged(listener: () => void) {
        this.previewSizeChangeListeners.push(listener);
    }

    unPreviewSizeChanged() {
        this.previewSizeChangeListeners = [];
    }

    private notifyPreviewSizeChanged() {
        this.previewSizeChangeListeners.forEach(listener => listener());
    }
}

export class ImagePreviewScrollHandler {

    private imagePreviewContainer: DivEl;

    private scrollDownButton: api.dom.Element;
    private scrollUpButton: api.dom.Element;
    private scrollBarWidth: number;
    private scrollBarRemoveTimeoutId: number;
    private scrolling: boolean;

    constructor(imagePreviewContainer: DivEl) {
        this.imagePreviewContainer = imagePreviewContainer;

        this.initializeImageScrollNavigation();

        this.imagePreviewContainer.onScroll(() => {
            this.toggleScrollButtons();
            this.showScrollBar();
            this.removeScrollBarOnTimeout();
        });
    }

    private initializeImageScrollNavigation() {
        this.scrollDownButton = this.createScrollButton('down');
        this.scrollUpButton = this.createScrollButton('up');
        this.initScrollbarWidth();
    }

    private isScrolledToTop(): boolean {
        const element = this.imagePreviewContainer.getHTMLElement();
        return element.scrollTop === 0;
    }

    private isScrolledToBottom(): boolean {
        const element = this.imagePreviewContainer.getHTMLElement();
        return (element.scrollHeight - element.scrollTop) === element.clientHeight;
    }

    private createScrollButton(direction: string): api.dom.Element {
        const scrollAreaDiv = new DivEl(direction === 'up' ? 'scroll-up-div' : 'scroll-down-div');
        const arrow = new DivEl('arrow');
        const scrollTop = (direction === 'up' ? '-=50' : '+=50');

        scrollAreaDiv.appendChild(arrow);

        arrow.onClicked((event) => {
            event.preventDefault();
            this.scrolling = false;
            wemjq(this.imagePreviewContainer.getHTMLElement()).animate({scrollTop: scrollTop}, 400);
        });

        arrow.onMouseOver(() => {
            this.scrolling = true;
            this.scrollImagePreview(direction);
        });

        arrow.onMouseOut(() => {
            this.scrolling = false;
        });

        direction === 'up'
        ? wemjq(scrollAreaDiv.getHTMLElement()).insertBefore(this.imagePreviewContainer.getHTMLElement().parentElement)
        : wemjq(scrollAreaDiv.getHTMLElement()).insertAfter(this.imagePreviewContainer.getHTMLElement().parentElement);

        scrollAreaDiv.hide();

        return scrollAreaDiv;
    }

    private initScrollbarWidth() {
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.width = '100px';
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps

        document.body.appendChild(outer);

        const widthNoScroll = outer.offsetWidth;
        // force scrollbars
        outer.style.overflow = 'scroll';

        // add innerdiv
        const inner = document.createElement('div');
        inner.style.width = '100%';
        outer.appendChild(inner);

        const widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);

        this.scrollBarWidth = widthNoScroll - widthWithScroll;
    }

    private scrollImagePreview(direction: string, scrollBy: number = 2) {
        const scrollByPx = (direction === 'up' ? '-=' : '+=') + Math.round(scrollBy) + 'px';
        const delta = 0.05;
        wemjq(this.imagePreviewContainer.getHTMLElement()).animate({scrollTop: scrollByPx}, 1, () => {
            if (this.scrolling) {
                // If we want to keep scrolling, call the scrollContent function again:
                this.scrollImagePreview(direction, scrollBy + delta);   // Increase scroll height by delta on each iteration
                                                                        // to emulate scrolling speed up effect
            }
        });
    }

    setMarginRight() {
        this.imagePreviewContainer.getEl().setMarginRight('');
        if (this.scrollDownButton.isVisible() || this.scrollUpButton.isVisible()) {
            this.imagePreviewContainer.getEl().setMarginRight('-' + this.scrollBarWidth + 'px');
        }
    }

    toggleScrollButtons() {
        if (this.isScrolledToBottom()) {
            this.scrollDownButton.hide();
        } else {
            this.scrollDownButton.show();
        }

        if (this.isScrolledToTop()) {
            this.scrollUpButton.hide();
        } else {
            this.scrollUpButton.show();
        }
    }

    resetScrollPosition() {
        this.imagePreviewContainer.getEl().setScrollTop(0);
    }

    private showScrollBar() {
        this.imagePreviewContainer.getHTMLElement().parentElement.style.marginRight = '-' + this.scrollBarWidth + 'px';
        this.imagePreviewContainer.getEl().setMarginRight('');
        this.imagePreviewContainer.getHTMLElement().style.overflowY = 'auto';
    }

    private removeScrollBarOnTimeout() {
        if (!!this.scrollBarRemoveTimeoutId) {
            window.clearTimeout(this.scrollBarRemoveTimeoutId);
        }

        this.scrollBarRemoveTimeoutId = window.setTimeout(() => {
            this.imagePreviewContainer.getHTMLElement().parentElement.style.marginRight = '';
            this.imagePreviewContainer.getEl().setMarginRight('-' + this.scrollBarWidth + 'px');
            this.imagePreviewContainer.getHTMLElement().style.overflowY = 'auto';
        }, 500);
    }
}

