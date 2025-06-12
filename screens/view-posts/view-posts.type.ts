export enum ViewPostsTypeEnum {
  RECENTLY_ADDED = 'recently_added',
  FREQUENTLY_ACCESSED = 'frequently_accessed'
}

export type ViewPostsPropsType = {
  type: ViewPostsTypeEnum;
}; 