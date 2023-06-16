import { Box, Progress, Text } from "@chakra-ui/react";

export function Loading({ children }: { children: string }) {
  return (
    <Box position="relative" textAlign="center">
      <Progress
        position="absolute"
        top="50%"
        left="0"
        right="0"
        flexGrow="1"
        borderRadius="2"
        size="xs"
        zIndex={-1}
        isIndeterminate
      />
      <Text as="span" backgroundColor="chakra-body-bg" px="2">
        {children}
      </Text>
    </Box>
  );
}
