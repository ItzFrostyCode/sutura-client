'use client';

import React from 'react';
import { DetailedCatalogItem } from './detailTypes';
import CatalogEditableOverview from '../editable/CatalogEditableOverview';
import type { CatalogSectionEdit } from '../editable/useCatalogSectionEdit';

interface CatalogOverviewTabProps {
  readonly item: DetailedCatalogItem;
  readonly edit: CatalogSectionEdit;
}

export default function CatalogOverviewTab({ item, edit }: CatalogOverviewTabProps) {
  return <CatalogEditableOverview item={item} edit={edit} />;
}
