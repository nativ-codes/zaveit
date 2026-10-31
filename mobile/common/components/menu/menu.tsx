import { Spacer } from "@/common/layouts";
import React from "react";
import MenuItem from "./menu-item/menu-item";
import styles from "./menu.style";
import { MenuPropsType } from "./menu.type";

function Menu({ children }: MenuPropsType) {
  return (
    <Spacer gap="s8" style={styles.card}>
      {children}
    </Spacer>
  );
}

Menu.Item = MenuItem;
export default Menu;
