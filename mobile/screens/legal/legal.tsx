import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { Legal as LegalConstant } from '@/common/constants';
import { ScreenLayout, Spacer } from '@/common/layouts';

import { TopBar } from '@/common/components';
import { GeneralStyles } from '@/common/styles';
import { LegalEnum } from '@/types';

function LegalScreen() {
	const { type }: { type: LegalEnum } = useLocalSearchParams();
	const data = LegalConstant[type];

	return (
    <ScreenLayout>
      <TopBar hasBackButton />
      <Spacer gap="s16" direction="horizontal" size="s16">
        <Text style={GeneralStyles.textTitleScreenPrimary}>{data.title}</Text>
        <Spacer gap="s16">
          <Text style={GeneralStyles.textLabelMediumSecondary}>
            {data.lastUpdated}
          </Text>
          {data.sections.map(({ title, content, sections }) => (
            <Spacer gap="s8" key={title}>
              <Text style={GeneralStyles.textTitlePostMediumPrimary}>
                {title}
              </Text>
              {Boolean(content) && (
                <Text style={GeneralStyles.textLabelLargePrimary}>
                  {content}
                </Text>
              )}
              {Boolean(sections) &&
                sections?.map(({ content }) => (
                  <Spacer direction="left" size="s16" key={content}>
                    <Text style={GeneralStyles.textLabelLargePrimary}>
                      {" "}
                      - {content}
                    </Text>
                  </Spacer>
                ))}
            </Spacer>
          ))}
        </Spacer>
      </Spacer>
    </ScreenLayout>
  );
}

export default LegalScreen;
