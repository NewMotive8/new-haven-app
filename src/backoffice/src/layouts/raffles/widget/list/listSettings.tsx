import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import React, { useContext } from "react";
import { CrudContext } from "../../instance/index";


export const columns: Array<dataGridColumnType> = [
  {
    key: 'id',
    uniqueId: 'id',
    label: 'ID',
  },
  {
    key: 'locale',
    uniqueId: 'locale',
    label: 'Locale',
  },
  {
    key: 'headerText',
    uniqueId: 'headerText',
    label: 'Header text',
  },
]



