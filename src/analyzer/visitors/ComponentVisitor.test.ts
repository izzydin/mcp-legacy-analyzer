import { describe, it, expect } from 'vitest';
import { ComponentVisitor } from './ComponentVisitor';
import { parseSourceCode } from '../../utils/parser';

// --- Mock Data ---

const legacyUserList = `
import React, { Component } from 'react';

class UserList extends Component {
  render() {
    return <div>User List</div>;
  }
}

export default UserList;
`;

const modernUserProfile = `
import React from 'react';

const UserProfile = ({ user }) => {
  return <div>{user.name}</div>;
};

export default UserProfile;
`;

const namedDefaultExportClass = `
import React from 'react';

export default class MainAppClass extends React.Component {
  render() {
    return <main>Main App</main>;
  }
}
`;

const anonymousDefaultExportFunction = `
import React from 'react';

export default function() {
  return <div>Anonymous View</div>;
}
`;

const noComponentsFile = `
import { calculateSum } from './mathUtils';

export function processData(data) {
  const result = calculateSum(data.values);
  return { ...data, sum: result };
}

export const API_ENDPOINT = 'https://api.example.com/v1';
`;

describe('ComponentVisitor', () => {

  describe('Accuracy', () => {
    it('should correctly identify UserList as a ClassComponent', () => {
      // Arrange
      const ast = parseSourceCode(legacyUserList);
      
      // Act
      const components = ComponentVisitor.extractComponents(ast);
      
      // Assert
      expect(components).toHaveLength(1);
      expect(components[0].name).toBe('UserList');
      expect(components[0].type).toBe('Class');
    });

    it('should correctly identify UserProfile as a FunctionalComponent', () => {
      // Arrange
      const ast = parseSourceCode(modernUserProfile);
      
      // Act
      const components = ComponentVisitor.extractComponents(ast);
      
      // Assert
      expect(components).toHaveLength(1);
      expect(components[0].name).toBe('UserProfile');
      expect(components[0].type).toBe('Functional');
    });
  });

  describe('Metadata', () => {
    it('should capture correct component names for named default exports', () => {
      // Arrange
      const ast = parseSourceCode(namedDefaultExportClass);
      
      // Act
      const components = ComponentVisitor.extractComponents(ast);
      
      // Assert
      expect(components).toHaveLength(1);
      expect(components[0].name).toBe('MainAppClass');
      expect(components[0].type).toBe('Class');
      expect(components[0].startLine).toBeGreaterThan(0);
      expect(components[0].endLine).toBeGreaterThan(components[0].startLine);
    });

    it('should identify anonymous default exports with a fallback name', () => {
      // Arrange
      const ast = parseSourceCode(anonymousDefaultExportFunction);
      
      // Act
      const components = ComponentVisitor.extractComponents(ast);
      
      // Assert
      expect(components).toHaveLength(1);
      expect(components[0].name).toBe('AnonymousFunction');
      expect(components[0].type).toBe('Functional');
    });
  });

  describe('Resilience', () => {
    it('should handle a file with no React components gracefully returning an empty array', () => {
      // Arrange
      const ast = parseSourceCode(noComponentsFile);
      
      // Act
      const components = ComponentVisitor.extractComponents(ast);
      
      // Assert
      expect(components).toHaveLength(0);
      expect(components).toEqual([]);
    });
  });

});
