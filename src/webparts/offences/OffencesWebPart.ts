import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import { setRTL } from '@fluentui/react/lib/Utilities';

import { OffencesApp } from './components/OffencesApp';
import { DEFAULT_CASE_ID_PARAM, DEFAULT_CASE_NAME_PARAM } from './config';
import { IServices, createServices } from './services';
import { S } from './strings';

export interface IOffencesWebPartProps {
  /** Name of the URL parameter that carries the Cases item ID. Default: caseId. */
  caseIdParam: string;
  /** Name of the URL parameter that carries Cases.caseName. Default: caseName. */
  caseNameParam: string;
  /** "תיק לבדיקה": a case ID or a caseName, used only when the URL names no case. */
  testCase: string;
}

export default class OffencesWebPart extends BaseClientSideWebPart<IOffencesWebPartProps> {
  private services!: IServices;

  protected async onInit(): Promise<void> {
    await super.onInit();
    // The whole UI is Hebrew. Note: Fluent's setRTL(true) also sets dir="rtl" on <html>.
    setRTL(true);
    initializeIcons();
    this.services = createServices(this.context);
  }

  public render(): void {
    const element = React.createElement(OffencesApp, {
      services: this.services,
      caseIdParam: (this.properties.caseIdParam || '').trim() || DEFAULT_CASE_ID_PARAM,
      caseNameParam: (this.properties.caseNameParam || '').trim() || DEFAULT_CASE_NAME_PARAM,
      testCase: this.properties.testCase || ''
    });
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  // Apply button instead of re-resolving the case on every keystroke.
  protected get disableReactivePropertyChanges(): boolean {
    return true;
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: S.paneGroupTitle,
              groupFields: [
                PropertyPaneTextField('testCase', {
                  label: S.paneTestCaseLabel,
                  description: S.paneTestCaseDescription
                }),
                PropertyPaneTextField('caseIdParam', {
                  label: S.paneCaseIdParamLabel,
                  placeholder: DEFAULT_CASE_ID_PARAM
                }),
                PropertyPaneTextField('caseNameParam', {
                  label: S.paneCaseNameParamLabel,
                  placeholder: DEFAULT_CASE_NAME_PARAM
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
